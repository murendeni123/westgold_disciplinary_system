-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- These policies provide an additional layer of security at the database level.
-- Even if application code has bugs, RLS prevents cross-school data access.
-- 
-- NOTE: With schema-per-school architecture, RLS is a backup safety measure.
-- The primary isolation is achieved through separate schemas.
-- ============================================================================

-- ============================================================================
-- PUBLIC SCHEMA RLS POLICIES
-- ============================================================================

-- Enable RLS on public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own record (unless platform admin)
CREATE POLICY users_isolation ON public.users
    FOR ALL
    USING (
        id = current_setting('app.current_user_id', true)::INTEGER
        OR current_setting('app.is_platform_admin', true) = 'true'
    );

-- Policy: Users can only see their own school links
CREATE POLICY user_schools_isolation ON public.user_schools
    FOR ALL
    USING (
        user_id = current_setting('app.current_user_id', true)::INTEGER
        OR current_setting('app.is_platform_admin', true) = 'true'
    );

-- Policy: Users can only see schools they belong to (or platform admin sees all)
CREATE POLICY schools_visibility ON public.schools
    FOR SELECT
    USING (
        id IN (
            SELECT school_id FROM public.user_schools 
            WHERE user_id = current_setting('app.current_user_id', true)::INTEGER
        )
        OR current_setting('app.is_platform_admin', true) = 'true'
    );

-- Policy: Only platform admins can modify schools
CREATE POLICY schools_modification ON public.schools
    FOR ALL
    USING (current_setting('app.is_platform_admin', true) = 'true');

-- Policy: Platform logs visible only to platform admins
CREATE POLICY platform_logs_admin_only ON public.platform_logs
    FOR ALL
    USING (current_setting('app.is_platform_admin', true) = 'true');

-- Policy: Import history visible to school users and platform admins
CREATE POLICY import_history_visibility ON public.import_history
    FOR ALL
    USING (
        school_id IN (
            SELECT school_id FROM public.user_schools 
            WHERE user_id = current_setting('app.current_user_id', true)::INTEGER
        )
        OR current_setting('app.is_platform_admin', true) = 'true'
    );

-- ============================================================================
-- HELPER FUNCTION: Set RLS context
-- ============================================================================
-- Call this function at the start of each request to set the RLS context

CREATE OR REPLACE FUNCTION public.set_rls_context(
    p_user_id INTEGER,
    p_school_id INTEGER DEFAULT NULL,
    p_is_platform_admin BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', COALESCE(p_user_id::TEXT, ''), false);
    PERFORM set_config('app.current_school_id', COALESCE(p_school_id::TEXT, ''), false);
    PERFORM set_config('app.is_platform_admin', p_is_platform_admin::TEXT, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: Clear RLS context
-- ============================================================================

CREATE OR REPLACE FUNCTION public.clear_rls_context() RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', '', false);
    PERFORM set_config('app.current_school_id', '', false);
    PERFORM set_config('app.is_platform_admin', 'false', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SCHOOL SCHEMA RLS TEMPLATE
-- ============================================================================
-- These policies should be applied to each school schema.
-- Replace {SCHEMA_NAME} with actual schema name.
-- ============================================================================

/*
-- Enable RLS on school schema tables
ALTER TABLE {SCHEMA_NAME}.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE {SCHEMA_NAME}.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE {SCHEMA_NAME}.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE {SCHEMA_NAME}.behaviour_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE {SCHEMA_NAME}.merits ENABLE ROW LEVEL SECURITY;
ALTER TABLE {SCHEMA_NAME}.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE {SCHEMA_NAME}.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE {SCHEMA_NAME}.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers and admins can see all students
CREATE POLICY students_staff_access ON {SCHEMA_NAME}.students
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM {SCHEMA_NAME}.teachers t 
            WHERE t.user_id = current_setting('app.current_user_id', true)::INTEGER
        )
    );

-- Policy: Parents can only see their own children
CREATE POLICY students_parent_access ON {SCHEMA_NAME}.students
    FOR SELECT
    USING (
        parent_id = current_setting('app.current_user_id', true)::INTEGER
        OR secondary_parent_id = current_setting('app.current_user_id', true)::INTEGER
    );

-- Policy: Teachers can see all incidents
CREATE POLICY incidents_teacher_access ON {SCHEMA_NAME}.behaviour_incidents
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM {SCHEMA_NAME}.teachers t 
            WHERE t.user_id = current_setting('app.current_user_id', true)::INTEGER
        )
    );

-- Policy: Parents can only see incidents for their children
CREATE POLICY incidents_parent_access ON {SCHEMA_NAME}.behaviour_incidents
    FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM {SCHEMA_NAME}.students 
            WHERE parent_id = current_setting('app.current_user_id', true)::INTEGER
        )
    );

-- Policy: Users can only see their own notifications
CREATE POLICY notifications_user_access ON {SCHEMA_NAME}.notifications
    FOR ALL
    USING (
        user_id = current_setting('app.current_user_id', true)::INTEGER
    );

-- Policy: Users can only see messages sent to them
CREATE POLICY messages_receiver_access ON {SCHEMA_NAME}.messages
    FOR SELECT
    USING (
        receiver_id = current_setting('app.current_user_id', true)::INTEGER
        OR sender_id = current_setting('app.current_user_id', true)::INTEGER
    );
*/

-- ============================================================================
-- BYPASS RLS FOR SERVICE ROLE
-- ============================================================================
-- The application service role should bypass RLS for administrative operations.
-- This is typically set up in Supabase or your PostgreSQL configuration.

-- Example (run as superuser):
-- ALTER ROLE your_service_role BYPASSRLS;

-- ============================================================================
-- NOTES ON RLS IMPLEMENTATION
-- ============================================================================
-- 
-- 1. RLS is a BACKUP safety measure. Primary isolation is via separate schemas.
-- 
-- 2. The application must call set_rls_context() at the start of each request
--    to set the current user and school context.
-- 
-- 3. For Supabase, you can use the built-in auth.uid() function instead of
--    custom session variables.
-- 
-- 4. RLS policies add some overhead. Monitor query performance after enabling.
-- 
-- 5. Test thoroughly! RLS can cause unexpected "no rows returned" issues.
-- 
-- ============================================================================
