-- Migration: Create Invoicing System
-- Description: Creates tables for invoice templates, invoices, and billing schedules

-- Invoice Templates Table
CREATE TABLE IF NOT EXISTS public.invoice_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_file_url TEXT NOT NULL,
    template_type VARCHAR(50) DEFAULT 'pdf', -- 'pdf', 'html', 'docx'
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES public.users(id)
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    school_id INTEGER REFERENCES public.schools(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES public.invoice_templates(id),
    subscription_id INTEGER,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ZAR',
    billing_period_start DATE,
    billing_period_end DATE,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded'
    payment_status VARCHAR(20) DEFAULT 'unpaid', -- 'unpaid', 'paid', 'partial', 'refunded'
    pdf_url TEXT,
    notes TEXT,
    sent_at TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES public.users(id)
);

-- Billing Schedules Table
CREATE TABLE IF NOT EXISTS public.billing_schedules (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES public.schools(id) ON DELETE CASCADE UNIQUE,
    frequency VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'semi-annually', 'annually'
    next_billing_date DATE NOT NULL,
    last_billing_date DATE,
    auto_generate BOOLEAN DEFAULT TRUE,
    auto_send BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    billing_day INTEGER DEFAULT 1, -- Day of month for billing (1-31)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Line Items Table (for detailed invoices)
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Payment History Table
CREATE TABLE IF NOT EXISTS public.invoice_payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES public.invoices(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50), -- 'bank_transfer', 'credit_card', 'cash', 'other'
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES public.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_school_id ON public.invoices(school_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON public.invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_billing_schedules_school_id ON public.billing_schedules(school_id);
CREATE INDEX IF NOT EXISTS idx_billing_schedules_next_billing_date ON public.billing_schedules(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON public.invoice_payments(invoice_id);

-- Add currency column to subscription_plans if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'subscription_plans' 
                   AND column_name = 'currency') THEN
        ALTER TABLE public.subscription_plans ADD COLUMN currency VARCHAR(3) DEFAULT 'ZAR';
    END IF;
END $$;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
    invoice_num TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.invoices
    WHERE invoice_number LIKE 'INV-%';
    
    invoice_num := 'INV-' || LPAD(next_num::TEXT, 6, '0');
    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Function to update next billing date
CREATE OR REPLACE FUNCTION update_next_billing_date(schedule_id INTEGER)
RETURNS DATE AS $$
DECLARE
    schedule_record RECORD;
    next_date DATE;
BEGIN
    SELECT * INTO schedule_record FROM public.billing_schedules WHERE id = schedule_id;
    
    CASE schedule_record.frequency
        WHEN 'monthly' THEN
            next_date := schedule_record.next_billing_date + INTERVAL '1 month';
        WHEN 'quarterly' THEN
            next_date := schedule_record.next_billing_date + INTERVAL '3 months';
        WHEN 'semi-annually' THEN
            next_date := schedule_record.next_billing_date + INTERVAL '6 months';
        WHEN 'annually' THEN
            next_date := schedule_record.next_billing_date + INTERVAL '1 year';
        ELSE
            next_date := schedule_record.next_billing_date + INTERVAL '1 month';
    END CASE;
    
    UPDATE public.billing_schedules 
    SET next_billing_date = next_date,
        last_billing_date = schedule_record.next_billing_date,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = schedule_id;
    
    RETURN next_date;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_templates_updated_at BEFORE UPDATE ON public.invoice_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_schedules_updated_at BEFORE UPDATE ON public.billing_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default invoice template placeholder
INSERT INTO public.invoice_templates (name, description, template_file_url, is_default, is_active)
VALUES ('Default Template', 'Standard invoice template', '/templates/default-invoice.html', TRUE, TRUE)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.invoice_templates IS 'Stores invoice template files uploaded by platform admins';
COMMENT ON TABLE public.invoices IS 'Stores all invoices generated for schools';
COMMENT ON TABLE public.billing_schedules IS 'Stores billing schedule configuration for each school';
COMMENT ON TABLE public.invoice_line_items IS 'Stores detailed line items for invoices';
COMMENT ON TABLE public.invoice_payments IS 'Tracks payment history for invoices';
