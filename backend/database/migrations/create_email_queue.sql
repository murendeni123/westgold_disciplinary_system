-- Create email queue table for managing email notifications
CREATE TABLE IF NOT EXISTS public.email_queue (
    id SERIAL PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    html_body TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed', 'retry')),
    priority INTEGER DEFAULT 5,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON public.email_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON public.email_queue(priority, status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_queue_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_queue_updated_at
    BEFORE UPDATE ON public.email_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_email_queue_timestamp();
