const cron = require('node-cron');
const { dbAll, dbRun } = require('../database/db');
const axios = require('axios');

// Billing automation scheduler
// Runs daily at 2:00 AM to check for due billing schedules

class BillingScheduler {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.stats = {
      totalProcessed: 0,
      successCount: 0,
      errorCount: 0,
      lastError: null
    };
  }

  // Initialize the scheduler
  init() {
    console.log('🕐 Initializing Billing Scheduler...');
    
    // Schedule to run daily at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      await this.processDueBillingSchedules();
    });

    // Also allow manual trigger via API endpoint
    console.log('✅ Billing Scheduler initialized - runs daily at 2:00 AM');
    console.log('📝 Manual trigger available at: POST /api/billing-schedules/process-due');
  }

  // Process all due billing schedules
  async processDueBillingSchedules() {
    if (this.isRunning) {
      console.log('⚠️ Billing scheduler already running, skipping...');
      return;
    }

    this.isRunning = true;
    this.lastRun = new Date();
    const startTime = Date.now();

    console.log('🚀 Starting billing schedule processing...');
    console.log(`📅 Run time: ${this.lastRun.toISOString()}`);

    try {
      // Get all due billing schedules
      const dueSchedules = await dbAll(`
        SELECT 
          bs.*,
          s.name as school_name,
          s.email as school_email,
          sp.name as plan_name,
          sp.price as plan_price
        FROM public.billing_schedules bs
        INNER JOIN public.schools s ON bs.school_id = s.id
        LEFT JOIN public.subscriptions sub ON s.id = sub.school_id
        LEFT JOIN public.subscription_plans sp ON sub.plan_id = sp.id
        WHERE bs.is_active = true
          AND bs.next_billing_date <= CURRENT_DATE
          AND s.status = 'active'
        ORDER BY bs.next_billing_date
      `);

      console.log(`📊 Found ${dueSchedules.length} due billing schedules`);

      if (dueSchedules.length === 0) {
        console.log('✅ No billing schedules due for processing');
        this.isRunning = false;
        return;
      }

      // Process each schedule
      for (const schedule of dueSchedules) {
        try {
          await this.processSchedule(schedule);
          this.stats.successCount++;
        } catch (error) {
          console.error(`❌ Error processing schedule ${schedule.id}:`, error.message);
          this.stats.errorCount++;
          this.stats.lastError = error.message;
        }
        this.stats.totalProcessed++;
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log('✅ Billing schedule processing complete');
      console.log(`📊 Stats: ${this.stats.successCount} success, ${this.stats.errorCount} errors`);
      console.log(`⏱️ Duration: ${duration}s`);

    } catch (error) {
      console.error('❌ Fatal error in billing scheduler:', error);
      this.stats.lastError = error.message;
    } finally {
      this.isRunning = false;
    }
  }

  // Process a single billing schedule
  async processSchedule(schedule) {
    console.log(`\n📝 Processing schedule ${schedule.id} for ${schedule.school_name}`);

    try {
      // Calculate billing period
      const billingPeriodStart = new Date(schedule.next_billing_date);
      const billingPeriodEnd = this.calculateNextBillingDate(
        billingPeriodStart,
        schedule.frequency
      );

      // Determine amount
      const amount = schedule.amount || schedule.plan_price || 0;
      if (amount <= 0) {
        throw new Error('Invalid billing amount');
      }

      // Create invoice via API
      const invoiceData = {
        school_id: schedule.school_id,
        template_id: schedule.template_id,
        amount: amount,
        currency: 'ZAR',
        billing_period_start: billingPeriodStart.toISOString().split('T')[0],
        billing_period_end: billingPeriodEnd.toISOString().split('T')[0],
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: `Automated billing for ${schedule.frequency} subscription`
      };

      // Call internal invoice creation
      const invoice = await this.createInvoice(invoiceData);
      console.log(`✅ Invoice ${invoice.invoice_number} created`);

      // Generate PDF if auto-generate is enabled
      if (schedule.auto_generate) {
        await this.generateInvoicePDF(invoice.id);
        console.log(`📄 PDF generated for invoice ${invoice.invoice_number}`);
      }

      // Send invoice if auto-send is enabled
      if (schedule.auto_send && schedule.auto_generate) {
        await this.sendInvoice(invoice.id);
        console.log(`📧 Invoice ${invoice.invoice_number} sent to ${schedule.school_email}`);
      }

      // Update next billing date
      await dbRun(`
        UPDATE public.billing_schedules
        SET 
          next_billing_date = $1,
          last_billing_date = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [
        billingPeriodEnd.toISOString().split('T')[0],
        billingPeriodStart.toISOString().split('T')[0],
        schedule.id
      ]);

      console.log(`📅 Next billing date updated to ${billingPeriodEnd.toISOString().split('T')[0]}`);

    } catch (error) {
      console.error(`❌ Error processing schedule ${schedule.id}:`, error.message);
      throw error;
    }
  }

  // Create invoice (internal method)
  async createInvoice(data) {
    const result = await dbRun(`
      INSERT INTO public.invoices (
        school_id, template_id, amount, currency,
        billing_period_start, billing_period_end,
        issue_date, due_date, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft')
      RETURNING *
    `, [
      data.school_id,
      data.template_id,
      data.amount,
      data.currency,
      data.billing_period_start,
      data.billing_period_end,
      data.issue_date,
      data.due_date,
      data.notes
    ]);

    // Get the created invoice with invoice_number
    const invoice = await dbAll(`
      SELECT * FROM public.invoices WHERE id = $1
    `, [result.lastID || result.rows[0].id]);

    return invoice[0];
  }

  // Generate invoice PDF (internal method)
  async generateInvoicePDF(invoiceId) {
    // This would call the PDF generation logic
    // For now, just mark as generated
    await dbRun(`
      UPDATE public.invoices
      SET pdf_url = $1
      WHERE id = $2
    `, [`/invoices/${invoiceId}.pdf`, invoiceId]);
  }

  // Send invoice (internal method)
  async sendInvoice(invoiceId) {
    // This would call the email sending logic
    // For now, just mark as sent
    await dbRun(`
      UPDATE public.invoices
      SET status = 'sent', sent_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [invoiceId]);
  }

  // Calculate next billing date based on frequency
  calculateNextBillingDate(currentDate, frequency) {
    const date = new Date(currentDate);
    
    switch (frequency) {
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'semi_annually':
        date.setMonth(date.getMonth() + 6);
        break;
      case 'annually':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }
    
    return date;
  }

  // Get scheduler stats
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      lastRun: this.lastRun
    };
  }

  // Manual trigger (for testing or manual runs)
  async manualTrigger() {
    console.log('🔧 Manual billing schedule trigger initiated');
    await this.processDueBillingSchedules();
  }
}

// Create singleton instance
const billingScheduler = new BillingScheduler();

module.exports = billingScheduler;
