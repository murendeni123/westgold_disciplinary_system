-- This SQL file documents all the queries that need to be fixed
-- The issue: queries are trying to access t.name from teachers table
-- Solution: JOIN teachers with public.users to get the name

-- Pattern to fix:
-- OLD: LEFT JOIN teachers t ON ... WHERE ... t.name
-- NEW: LEFT JOIN teachers t ON ... LEFT JOIN public.users u ON t.user_id = u.id WHERE ... u.name

-- Files that need fixing:
-- 1. routes/analytics.js - multiple queries
-- 2. routes/behaviour.js - incident queries
-- 3. routes/merits.js - merit queries  
-- 4. routes/attendance.js - attendance queries
-- 5. routes/classes.js - class queries
-- 6. routes/exports.js - export queries
-- 7. routes/periodTimetables.js - timetable queries

-- The fix is to add: LEFT JOIN public.users u ON t.user_id = u.id
-- And change: t.name to u.name
