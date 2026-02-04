const express = require('express');
const multer = require('multer');
const { dbAll, dbGet, dbRun } = require('../database/db');
const { uploadToSupabase, deleteFromSupabase } = require('../middleware/supabaseUpload');
const { sendEmail } = require('../utils/emailService');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'text/html', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, HTML, and DOCX are allowed.'));
        }
    }
});

// ==================== INVOICE TEMPLATES ====================

router.get('/templates', requirePlatformAdmin, async (req, res) => {
    try {
        const templates = await dbAll('SELECT * FROM invoice_templates ORDER BY is_default DESC, created_at DESC');
        res.json({ templates });
    } catch (error) {
        console.error('Error fetching invoice templates:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/templates/:id', requirePlatformAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const template = await dbGet('SELECT * FROM invoice_templates WHERE id = $1', [id]);
        
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        
        res.json({ template });
    } catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/templates', requirePlatformAdmin, upload.single('template'), async (req, res) => {
    try {
        const { name, description, is_default } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'Template file is required' });
        }

        if (!name) {
            return res.status(400).json({ error: 'Template name is required' });
        }

        const fileExtension = file.originalname.split('.').pop();
        const fileName = `invoice-template-${Date.now()}.${fileExtension}`;
        const filePath = `invoice-templates/${fileName}`;

        const uploadResult = await uploadToSupabase(file.buffer, filePath, file.mimetype);

        if (!uploadResult.success) {
            return res.status(500).json({ error: 'Failed to upload template file' });
        }

        if (is_default === 'true' || is_default === true) {
            await dbRun('UPDATE invoice_templates SET is_default = FALSE WHERE is_default = TRUE');
        }

        const result = await dbRun(
            `INSERT INTO invoice_templates (name, description, template_file_url, template_type, is_default, created_by)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [name, description || null, uploadResult.url, fileExtension, is_default === 'true' || is_default === true, req.platformAdmin.userId]
        );

        const template = await dbGet('SELECT * FROM invoice_templates WHERE id = $1', [result.id]);

        res.status(201).json({ 
            message: 'Invoice template created successfully',
            template 
        });
    } catch (error) {
        console.error('Error creating invoice template:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/templates/:id', requirePlatformAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, is_default, is_active } = req.body;

        const template = await dbGet('SELECT * FROM invoice_templates WHERE id = $1', [id]);
        
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        if (is_default === 'true' || is_default === true) {
            await dbRun('UPDATE invoice_templates SET is_default = FALSE WHERE is_default = TRUE AND id != $1', [id]);
        }

        await dbRun(
            `UPDATE invoice_templates 
             SET name = $1, description = $2, is_default = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
             WHERE id = $5`,
            [name || template.name, description !== undefined ? description : template.description, 
             is_default !== undefined ? is_default : template.is_default,
             is_active !== undefined ? is_active : template.is_active, id]
        );

        const updatedTemplate = await dbGet('SELECT * FROM invoice_templates WHERE id = $1', [id]);

        res.json({ 
            message: 'Template updated successfully',
            template: updatedTemplate 
        });
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/templates/:id', requirePlatformAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const template = await dbGet('SELECT * FROM invoice_templates WHERE id = $1', [id]);
        
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        if (template.is_default) {
            return res.status(400).json({ error: 'Cannot delete the default template' });
        }

        const invoiceCount = await dbGet('SELECT COUNT(*) as count FROM invoices WHERE template_id = $1', [id]);
        
        if (invoiceCount.count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete template that is used by existing invoices',
                invoice_count: invoiceCount.count 
            });
        }

        if (template.template_file_url) {
            await deleteFromSupabase(template.template_file_url);
        }

        await dbRun('DELETE FROM invoice_templates WHERE id = $1', [id]);

        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/templates/:id/set-default', requirePlatformAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const template = await dbGet('SELECT * FROM invoice_templates WHERE id = $1', [id]);
        
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        await dbRun('UPDATE invoice_templates SET is_default = FALSE WHERE is_default = TRUE');
        await dbRun('UPDATE invoice_templates SET is_default = TRUE WHERE id = $1', [id]);

        res.json({ message: 'Default template updated successfully' });
    } catch (error) {
        console.error('Error setting default template:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== INVOICES ====================

router.get('/', requirePlatformAdmin, async (req, res) => {
    try {
        const { school_id, status, start_date, end_date, limit = 100, offset = 0 } = req.query;

        let query = `
            SELECT i.*, s.name as school_name, t.name as template_name
            FROM invoices i
            LEFT JOIN schools s ON i.school_id = s.id
            LEFT JOIN invoice_templates t ON i.template_id = t.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (school_id) {
            query += ` AND i.school_id = $${paramIndex}`;
            params.push(school_id);
            paramIndex++;
        }

        if (status) {
            query += ` AND i.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (start_date) {
            query += ` AND i.issue_date >= $${paramIndex}`;
            params.push(start_date);
            paramIndex++;
        }

        if (end_date) {
            query += ` AND i.issue_date <= $${paramIndex}`;
            params.push(end_date);
            paramIndex++;
        }

        query += ` ORDER BY i.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const invoices = await dbAll(query, params);

        const countQuery = `SELECT COUNT(*) as total FROM invoices WHERE 1=1` +
            (school_id ? ` AND school_id = ${school_id}` : '') +
            (status ? ` AND status = '${status}'` : '');
        const countResult = await dbGet(countQuery);

        res.json({ 
            invoices,
            total: countResult.total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', requirePlatformAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await dbGet(`
            SELECT i.*, s.name as school_name, s.email as school_email, 
                   t.name as template_name, t.template_file_url
            FROM invoices i
            LEFT JOIN schools s ON i.school_id = s.id
            LEFT JOIN invoice_templates t ON i.template_id = t.id
            WHERE i.id = $1
        `, [id]);

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const lineItems = await dbAll('SELECT * FROM invoice_line_items WHERE invoice_id = $1', [id]);
        const payments = await dbAll('SELECT * FROM invoice_payments WHERE invoice_id = $1 ORDER BY payment_date DESC', [id]);

        res.json({ 
            invoice: {
                ...invoice,
                line_items: lineItems,
                payments
            }
        });
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', requirePlatformAdmin, async (req, res) => {
    try {
        const {
            school_id,
            template_id,
            amount,
            currency = 'ZAR',
            billing_period_start,
            billing_period_end,
            issue_date,
            due_date,
            notes,
            line_items = []
        } = req.body;

        if (!school_id || !amount || !issue_date || !due_date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const school = await dbGet('SELECT * FROM schools WHERE id = $1', [school_id]);
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        const invoiceNumberResult = await dbGet('SELECT generate_invoice_number() as invoice_number');
        const invoice_number = invoiceNumberResult.invoice_number;

        const result = await dbRun(
            `INSERT INTO invoices (invoice_number, school_id, template_id, amount, currency, 
                                   billing_period_start, billing_period_end, issue_date, due_date, 
                                   notes, status, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft', $11) RETURNING id`,
            [invoice_number, school_id, template_id, amount, currency, 
             billing_period_start, billing_period_end, issue_date, due_date, notes, req.platformAdmin.userId]
        );

        if (line_items.length > 0) {
            for (const item of line_items) {
                await dbRun(
                    `INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, total)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [result.id, item.description, item.quantity || 1, item.unit_price, item.total]
                );
            }
        }

        const invoice = await dbGet(`
            SELECT i.*, s.name as school_name 
            FROM invoices i
            LEFT JOIN schools s ON i.school_id = s.id
            WHERE i.id = $1
        `, [result.id]);

        res.status(201).json({ 
            message: 'Invoice created successfully',
            invoice 
        });
    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/:id', requirePlatformAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            amount,
            billing_period_start,
            billing_period_end,
            issue_date,
            due_date,
            status,
            payment_status,
            notes
        } = req.body;

        const invoice = await dbGet('SELECT * FROM invoices WHERE id = $1', [id]);
        
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        await dbRun(
            `UPDATE invoices 
             SET amount = $1, billing_period_start = $2, billing_period_end = $3,
                 issue_date = $4, due_date = $5, status = $6, payment_status = $7, notes = $8,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $9`,
            [
                amount !== undefined ? amount : invoice.amount,
                billing_period_start !== undefined ? billing_period_start : invoice.billing_period_start,
                billing_period_end !== undefined ? billing_period_end : invoice.billing_period_end,
                issue_date !== undefined ? issue_date : invoice.issue_date,
                due_date !== undefined ? due_date : invoice.due_date,
                status !== undefined ? status : invoice.status,
                payment_status !== undefined ? payment_status : invoice.payment_status,
                notes !== undefined ? notes : invoice.notes,
                id
            ]
        );

        if (payment_status === 'paid' && invoice.payment_status !== 'paid') {
            await dbRun('UPDATE invoices SET paid_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
        }

        const updatedInvoice = await dbGet(`
            SELECT i.*, s.name as school_name 
            FROM invoices i
            LEFT JOIN schools s ON i.school_id = s.id
            WHERE i.id = $1
        `, [id]);

        res.json({ 
            message: 'Invoice updated successfully',
            invoice: updatedInvoice 
        });
    } catch (error) {
        console.error('Error updating invoice:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', requirePlatformAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await dbGet('SELECT * FROM invoices WHERE id = $1', [id]);
        
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        if (invoice.status === 'paid') {
            return res.status(400).json({ error: 'Cannot delete paid invoices' });
        }

        if (invoice.pdf_url) {
            await deleteFromSupabase(invoice.pdf_url);
        }

        await dbRun('DELETE FROM invoice_line_items WHERE invoice_id = $1', [id]);
        await dbRun('DELETE FROM invoice_payments WHERE invoice_id = $1', [id]);
        await dbRun('DELETE FROM invoices WHERE id = $1', [id]);

        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        console.error('Error deleting invoice:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:id/generate-pdf', requirePlatformAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await dbGet(`
            SELECT i.*, s.name as school_name, s.email as school_email, s.address as school_address
            FROM invoices i
            LEFT JOIN schools s ON i.school_id = s.id
            WHERE i.id = $1
        `, [id]);

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const lineItems = await dbAll('SELECT * FROM invoice_line_items WHERE invoice_id = $1', [id]);

        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', async () => {
            const pdfBuffer = Buffer.concat(chunks);
            const fileName = `invoice-${invoice.invoice_number}.pdf`;
            const filePath = `invoices/school_${invoice.school_id}/${fileName}`;

            const uploadResult = await uploadToSupabase(pdfBuffer, filePath, 'application/pdf');

            if (!uploadResult.success) {
                return res.status(500).json({ error: 'Failed to upload PDF' });
            }

            await dbRun('UPDATE invoices SET pdf_url = $1 WHERE id = $2', [uploadResult.url, id]);

            res.json({ 
                message: 'PDF generated successfully',
                pdf_url: uploadResult.url 
            });
        });

        doc.fontSize(20).text('INVOICE', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Invoice Number: ${invoice.invoice_number}`);
        doc.text(`Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}`);
        doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`);
        doc.moveDown();
        doc.fontSize(14).text('Bill To:');
        doc.fontSize(12).text(invoice.school_name);
        if (invoice.school_address) doc.text(invoice.school_address);
        if (invoice.school_email) doc.text(invoice.school_email);
        doc.moveDown();

        if (lineItems.length > 0) {
            doc.fontSize(14).text('Items:');
            doc.moveDown(0.5);
            lineItems.forEach(item => {
                doc.fontSize(11).text(`${item.description} - Qty: ${item.quantity} x R${item.unit_price} = R${item.total}`);
            });
            doc.moveDown();
        }

        doc.fontSize(16).text(`Total Amount: R${invoice.amount}`, { align: 'right' });
        doc.fontSize(12).text(`Currency: ${invoice.currency}`, { align: 'right' });
        doc.moveDown();

        if (invoice.notes) {
            doc.fontSize(10).text(`Notes: ${invoice.notes}`);
        }

        doc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:id/send', requirePlatformAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await dbGet(`
            SELECT i.*, s.name as school_name, s.email as school_email
            FROM invoices i
            LEFT JOIN schools s ON i.school_id = s.id
            WHERE i.id = $1
        `, [id]);

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        if (!invoice.school_email) {
            return res.status(400).json({ error: 'School email not found' });
        }

        if (!invoice.pdf_url) {
            return res.status(400).json({ error: 'Invoice PDF not generated. Generate PDF first.' });
        }

        const emailSubject = `Invoice ${invoice.invoice_number} from Greenstem DMS`;
        const emailHtml = `
            <h2>Invoice ${invoice.invoice_number}</h2>
            <p>Dear ${invoice.school_name},</p>
            <p>Please find attached your invoice for the billing period.</p>
            <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
            <p><strong>Amount:</strong> R${invoice.amount} ${invoice.currency}</p>
            <p><strong>Issue Date:</strong> ${new Date(invoice.issue_date).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
            <p>You can download your invoice here: <a href="${invoice.pdf_url}">Download Invoice</a></p>
            <p>Thank you for your business!</p>
            <p>Best regards,<br>Greenstem DMS Team</p>
        `;

        await sendEmail({
            to: invoice.school_email,
            subject: emailSubject,
            html: emailHtml,
            text: `Invoice ${invoice.invoice_number} - Amount: R${invoice.amount} - Due: ${new Date(invoice.due_date).toLocaleDateString()}`
        });

        await dbRun('UPDATE invoices SET status = $1, sent_at = CURRENT_TIMESTAMP WHERE id = $2', ['sent', id]);

        res.json({ message: 'Invoice sent successfully' });
    } catch (error) {
        console.error('Error sending invoice:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/schools/:schoolId', requirePlatformAdmin, async (req, res) => {
    try {
        const { schoolId } = req.params;

        const invoices = await dbAll(`
            SELECT i.*, t.name as template_name
            FROM invoices i
            LEFT JOIN invoice_templates t ON i.template_id = t.id
            WHERE i.school_id = $1
            ORDER BY i.created_at DESC
        `, [schoolId]);

        res.json({ invoices });
    } catch (error) {
        console.error('Error fetching school invoices:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:id/payments', requirePlatformAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, payment_date, payment_method, reference_number, notes } = req.body;

        if (!amount || !payment_date) {
            return res.status(400).json({ error: 'Amount and payment date are required' });
        }

        const invoice = await dbGet('SELECT * FROM invoices WHERE id = $1', [id]);
        
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        await dbRun(
            `INSERT INTO invoice_payments (invoice_id, amount, payment_date, payment_method, reference_number, notes, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [id, amount, payment_date, payment_method, reference_number, notes, req.platformAdmin.userId]
        );

        const totalPaid = await dbGet('SELECT SUM(amount) as total FROM invoice_payments WHERE invoice_id = $1', [id]);
        const paidAmount = parseFloat(totalPaid.total) || 0;

        let paymentStatus = 'unpaid';
        if (paidAmount >= invoice.amount) {
            paymentStatus = 'paid';
            await dbRun('UPDATE invoices SET paid_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
        } else if (paidAmount > 0) {
            paymentStatus = 'partial';
        }

        await dbRun('UPDATE invoices SET payment_status = $1 WHERE id = $2', [paymentStatus, id]);

        res.json({ message: 'Payment recorded successfully' });
    } catch (error) {
        console.error('Error recording payment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
