-- Add suspension approval workflow fields to student_consequences table
-- This allows admins to approve/deny suspensions assigned by teachers

DO $$
DECLARE
    schema_name TEXT;
BEGIN
    -- Loop through all school schemas
    FOR schema_name IN 
        SELECT nspname 
        FROM pg_namespace 
        WHERE nspname LIKE 'school_%'
    LOOP
        -- Check if student_consequences table exists in this schema
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = schema_name 
            AND table_name = 'student_consequences'
        ) THEN
            -- Add approval workflow columns if they don't exist
            
            -- requires_approval: TRUE if this is a suspension assigned by a teacher
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = schema_name 
                AND table_name = 'student_consequences' 
                AND column_name = 'requires_approval'
            ) THEN
                EXECUTE format('ALTER TABLE %I.student_consequences ADD COLUMN requires_approval BOOLEAN DEFAULT FALSE', schema_name);
            END IF;
            
            -- approval_status: pending, approved, denied
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = schema_name 
                AND table_name = 'student_consequences' 
                AND column_name = 'approval_status'
            ) THEN
                EXECUTE format('ALTER TABLE %I.student_consequences ADD COLUMN approval_status TEXT CHECK (approval_status IN (''pending'', ''approved'', ''denied''))', schema_name);
            END IF;
            
            -- approved_by: admin who approved/denied
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = schema_name 
                AND table_name = 'student_consequences' 
                AND column_name = 'approved_by'
            ) THEN
                EXECUTE format('ALTER TABLE %I.student_consequences ADD COLUMN approved_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL', schema_name);
            END IF;
            
            -- approved_at: timestamp of approval/denial
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = schema_name 
                AND table_name = 'student_consequences' 
                AND column_name = 'approved_at'
            ) THEN
                EXECUTE format('ALTER TABLE %I.student_consequences ADD COLUMN approved_at TIMESTAMP', schema_name);
            END IF;
            
            -- approval_notes: admin notes on approval/denial
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = schema_name 
                AND table_name = 'student_consequences' 
                AND column_name = 'approval_notes'
            ) THEN
                EXECUTE format('ALTER TABLE %I.student_consequences ADD COLUMN approval_notes TEXT', schema_name);
            END IF;
            
            RAISE NOTICE 'Added suspension approval workflow columns to schema: %', schema_name;
        END IF;
    END LOOP;
END $$;
