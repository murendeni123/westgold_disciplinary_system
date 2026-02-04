-- Seed: System Features
-- Description: Seed all available system features (excluding Goldie Badge)
-- Date: 2024

-- Insert system features
INSERT INTO public.system_features (name, description, feature_key, category, is_premium) VALUES
-- Core Features
('Incident Management', 'Track and manage student incidents and behavioral issues', 'incident_management', 'core', false),
('Merit System', 'Award and track student merits and positive behaviors', 'merit_system', 'core', false),
('Detention Tracking', 'Schedule and manage student detentions', 'detention_tracking', 'core', false),
('Attendance Management', 'Track daily and period-based attendance', 'attendance_management', 'core', false),
('Class Management', 'Manage classes, grades, and student assignments', 'class_management', 'core', false),

-- Portal Features
('Parent Portal', 'Access for parents to view student information', 'parent_portal', 'portals', false),
('Teacher Portal', 'Access for teachers to manage classes and students', 'teacher_portal', 'portals', false),
('Admin Portal', 'Full administrative access and management', 'admin_portal', 'portals', false),

-- Advanced Features
('Reporting & Analytics', 'Generate reports and view analytics dashboards', 'reporting_analytics', 'advanced', true),
('Intervention Tracking', 'Track and manage student interventions', 'intervention_tracking', 'advanced', true),
('Consequence Management', 'Manage consequences and disciplinary actions', 'consequence_management', 'advanced', false),
('Timetable Management', 'Create and manage school timetables', 'timetable_management', 'advanced', true),

-- Communication Features
('Email Notifications', 'Send automated email notifications', 'email_notifications', 'communication', false),
('SMS Notifications', 'Send SMS notifications to parents and staff', 'sms_notifications', 'communication', true),

-- Integration Features
('Custom Branding', 'Customize portal branding and appearance', 'custom_branding', 'integration', true),
('API Access', 'Access to REST API for integrations', 'api_access', 'integration', true),
('Bulk Import/Export', 'Import and export data in bulk', 'bulk_import_export', 'integration', true)

ON CONFLICT (feature_key) DO NOTHING;

-- Verify insertion
SELECT 
    category,
    COUNT(*) as feature_count,
    COUNT(*) FILTER (WHERE is_premium = true) as premium_count
FROM public.system_features
GROUP BY category
ORDER BY category;

-- Display all features
SELECT 
    id,
    name,
    feature_key,
    category,
    is_premium,
    is_active
FROM public.system_features
ORDER BY category, name;
