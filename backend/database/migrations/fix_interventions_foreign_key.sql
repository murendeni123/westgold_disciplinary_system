-- Fix interventions foreign key to reference public.users instead of schema-local users
-- This migration needs to run on all school schemas

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
        -- Check if interventions table exists in this schema
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = schema_name 
            AND table_name = 'interventions'
        ) THEN
            -- Drop the old foreign key constraint
            EXECUTE format('ALTER TABLE %I.interventions DROP CONSTRAINT IF EXISTS interventions_assigned_by_fkey', schema_name);
            
            -- Add new foreign key constraint referencing public.users
            EXECUTE format('ALTER TABLE %I.interventions ADD CONSTRAINT interventions_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE CASCADE', schema_name);
            
            -- Also fix completed_by if it exists
            EXECUTE format('ALTER TABLE %I.interventions DROP CONSTRAINT IF EXISTS interventions_completed_by_fkey', schema_name);
            EXECUTE format('ALTER TABLE %I.interventions ADD CONSTRAINT interventions_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.users(id) ON DELETE SET NULL', schema_name);
            
            RAISE NOTICE 'Fixed interventions foreign keys in schema: %', schema_name;
        END IF;
    END LOOP;
END $$;
