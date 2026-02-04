const express = require('express');
const { dbAll, dbGet, dbRun } = require('../database/db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const requirePlatformAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'platform_admin') {
            return res.status(403).json({ error: 'Platform admin access required' });
        }
        req.platformAdmin = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

router.get('/', requirePlatformAdmin, async (req, res) => {
    try {
        const schedules = await dbAll(`
            SELECT bs.*, s.name as school_name
            FROM billing_schedules bs
            LEFT JOIN schools s ON bs.school_id = s.id
            ORDER BY bs.next_billing_date ASC
        `);

        res.json({ schedules });
    } catch (error) {
        console.error('Error fetching billing schedules:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/schools/:schoolId', requirePlatformAdmin, async (req, res) => {
    try {
        const { schoolId } = req.params;

        const schedule = await dbGet(`
            SELECT bs.*, s.name as school_name
            FROM billing_schedules bs
            LEFT JOIN schools s ON bs.school_id = s.id
            WHERE bs.school_id = $1
        `, [schoolId]);

        if (!schedule) {
            return res.status(404).json({ error: 'Billing schedule not found for this school' });
        }

        res.json({ schedule });
    } catch (error) {
        console.error('Error fetching billing schedule:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/schools/:schoolId', requirePlatformAdmin, async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { frequency, next_billing_date, auto_generate, auto_send, billing_day } = req.body;

        if (!frequency || !next_billing_date) {
            return res.status(400).json({ error: 'Frequency and next billing date are required' });
        }

        const validFrequencies = ['monthly', 'quarterly', 'semi-annually', 'annually'];
        if (!validFrequencies.includes(frequency)) {
            return res.status(400).json({ error: 'Invalid frequency' });
        }

        const school = await dbGet('SELECT * FROM schools WHERE id = $1', [schoolId]);
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        const existingSchedule = await dbGet('SELECT * FROM billing_schedules WHERE school_id = $1', [schoolId]);

        if (existingSchedule) {
            await dbRun(
                `UPDATE billing_schedules 
                 SET frequency = $1, next_billing_date = $2, auto_generate = $3, 
                     auto_send = $4, billing_day = $5, updated_at = CURRENT_TIMESTAMP
                 WHERE school_id = $6`,
                [frequency, next_billing_date, auto_generate !== false, auto_send !== false, billing_day || 1, schoolId]
            );
        } else {
            await dbRun(
                `INSERT INTO billing_schedules (school_id, frequency, next_billing_date, auto_generate, auto_send, billing_day)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [schoolId, frequency, next_billing_date, auto_generate !== false, auto_send !== false, billing_day || 1]
            );
        }

        const schedule = await dbGet(`
            SELECT bs.*, s.name as school_name
            FROM billing_schedules bs
            LEFT JOIN schools s ON bs.school_id = s.id
            WHERE bs.school_id = $1
        `, [schoolId]);

        res.json({ 
            message: 'Billing schedule saved successfully',
            schedule 
        });
    } catch (error) {
        console.error('Error saving billing schedule:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/schools/:schoolId', requirePlatformAdmin, async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { frequency, next_billing_date, auto_generate, auto_send, billing_day, is_active } = req.body;

        const schedule = await dbGet('SELECT * FROM billing_schedules WHERE school_id = $1', [schoolId]);
        
        if (!schedule) {
            return res.status(404).json({ error: 'Billing schedule not found' });
        }

        await dbRun(
            `UPDATE billing_schedules 
             SET frequency = $1, next_billing_date = $2, auto_generate = $3, 
                 auto_send = $4, billing_day = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
             WHERE school_id = $7`,
            [
                frequency !== undefined ? frequency : schedule.frequency,
                next_billing_date !== undefined ? next_billing_date : schedule.next_billing_date,
                auto_generate !== undefined ? auto_generate : schedule.auto_generate,
                auto_send !== undefined ? auto_send : schedule.auto_send,
                billing_day !== undefined ? billing_day : schedule.billing_day,
                is_active !== undefined ? is_active : schedule.is_active,
                schoolId
            ]
        );

        const updatedSchedule = await dbGet(`
            SELECT bs.*, s.name as school_name
            FROM billing_schedules bs
            LEFT JOIN schools s ON bs.school_id = s.id
            WHERE bs.school_id = $1
        `, [schoolId]);

        res.json({ 
            message: 'Billing schedule updated successfully',
            schedule: updatedSchedule 
        });
    } catch (error) {
        console.error('Error updating billing schedule:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/schools/:schoolId', requirePlatformAdmin, async (req, res) => {
    try {
        const { schoolId } = req.params;

        const schedule = await dbGet('SELECT * FROM billing_schedules WHERE school_id = $1', [schoolId]);
        
        if (!schedule) {
            return res.status(404).json({ error: 'Billing schedule not found' });
        }

        await dbRun('DELETE FROM billing_schedules WHERE school_id = $1', [schoolId]);

        res.json({ message: 'Billing schedule deleted successfully' });
    } catch (error) {
        console.error('Error deleting billing schedule:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/due', requirePlatformAdmin, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const dueSchedules = await dbAll(`
            SELECT bs.*, s.name as school_name, s.email as school_email,
                   sp.price, sp.name as plan_name
            FROM billing_schedules bs
            LEFT JOIN schools s ON bs.school_id = s.id
            LEFT JOIN school_subscriptions ss ON s.id = ss.school_id AND ss.status = 'active'
            LEFT JOIN subscription_plans sp ON ss.plan_id = sp.id
            WHERE bs.next_billing_date <= $1 
            AND bs.is_active = TRUE 
            AND bs.auto_generate = TRUE
            ORDER BY bs.next_billing_date ASC
        `, [today]);

        res.json({ schedules: dueSchedules });
    } catch (error) {
        console.error('Error fetching due schedules:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:id/process', requirePlatformAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const schedule = await dbGet(`
            SELECT bs.*, s.name as school_name, s.email as school_email, s.id as school_id,
                   sp.price, sp.name as plan_name, sp.id as plan_id
            FROM billing_schedules bs
            LEFT JOIN schools s ON bs.school_id = s.id
            LEFT JOIN school_subscriptions ss ON s.id = ss.school_id AND ss.status = 'active'
            LEFT JOIN subscription_plans sp ON ss.plan_id = sp.id
            WHERE bs.id = $1
        `, [id]);

        if (!schedule) {
            return res.status(404).json({ error: 'Billing schedule not found' });
        }

        if (!schedule.price) {
            return res.status(400).json({ error: 'No active subscription found for this school' });
        }

        const invoiceNumberResult = await dbGet('SELECT generate_invoice_number() as invoice_number');
        const invoice_number = invoiceNumberResult.invoice_number;

        const today = new Date();
        const issueDate = today.toISOString().split('T')[0];
        const dueDate = new Date(today.setDate(today.getDate() + 30)).toISOString().split('T')[0];

        let billingPeriodStart, billingPeriodEnd;
        const nextBillingDate = new Date(schedule.next_billing_date);

        switch (schedule.frequency) {
            case 'monthly':
                billingPeriodStart = new Date(nextBillingDate);
                billingPeriodEnd = new Date(nextBillingDate.setMonth(nextBillingDate.getMonth() + 1));
                break;
            case 'quarterly':
                billingPeriodStart = new Date(nextBillingDate);
                billingPeriodEnd = new Date(nextBillingDate.setMonth(nextBillingDate.getMonth() + 3));
                break;
            case 'semi-annually':
                billingPeriodStart = new Date(nextBillingDate);
                billingPeriodEnd = new Date(nextBillingDate.setMonth(nextBillingDate.getMonth() + 6));
                break;
            case 'annually':
                billingPeriodStart = new Date(nextBillingDate);
                billingPeriodEnd = new Date(nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1));
                break;
        }

        const result = await dbRun(
            `INSERT INTO invoices (invoice_number, school_id, amount, currency, 
                                   billing_period_start, billing_period_end, issue_date, due_date, 
                                   status, created_by)
             VALUES ($1, $2, $3, 'ZAR', $4, $5, $6, $7, 'draft', $8) RETURNING id`,
            [invoice_number, schedule.school_id, schedule.price, 
             billingPeriodStart.toISOString().split('T')[0], 
             billingPeriodEnd.toISOString().split('T')[0], 
             issueDate, dueDate, req.platformAdmin.userId]
        );

        await dbGet('SELECT update_next_billing_date($1)', [id]);

        const invoice = await dbGet('SELECT * FROM invoices WHERE id = $1', [result.id]);

        res.json({ 
            message: 'Invoice generated successfully from billing schedule',
            invoice 
        });
    } catch (error) {
        console.error('Error processing billing schedule:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
