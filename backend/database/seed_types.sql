-- Seed Incident Types, Merit Types, and Intervention Types for School 1

-- ============================================
-- INCIDENT TYPES (Behaviour/Demerit Types)
-- ============================================

INSERT INTO incident_types (name, default_points, default_severity, description, is_active, school_id)
SELECT 'Late to Class', 1, 'low', 'Student arrives late to class without valid excuse', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM incident_types WHERE name = 'Late to Class' AND school_id = 1);

INSERT INTO incident_types (name, default_points, default_severity, description, is_active, school_id)
SELECT 'Disruptive Behavior', 2, 'medium', 'Disrupting class activities or other students', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM incident_types WHERE name = 'Disruptive Behavior' AND school_id = 1);

INSERT INTO incident_types (name, default_points, default_severity, description, is_active, school_id)
SELECT 'Incomplete Homework', 1, 'low', 'Failure to complete assigned homework', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM incident_types WHERE name = 'Incomplete Homework' AND school_id = 1);

INSERT INTO incident_types (name, default_points, default_severity, description, is_active, school_id)
SELECT 'Uniform Violation', 1, 'low', 'Not wearing proper school uniform', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM incident_types WHERE name = 'Uniform Violation' AND school_id = 1);

INSERT INTO incident_types (name, default_points, default_severity, description, is_active, school_id)
SELECT 'Bullying', 5, 'high', 'Physical or verbal bullying of other students', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM incident_types WHERE name = 'Bullying' AND school_id = 1);

INSERT INTO incident_types (name, default_points, default_severity, description, is_active, school_id)
SELECT 'Fighting', 5, 'high', 'Physical altercation with another student', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM incident_types WHERE name = 'Fighting' AND school_id = 1);

INSERT INTO incident_types (name, default_points, default_severity, description, is_active, school_id)
SELECT 'Vandalism', 4, 'high', 'Intentional damage to school property', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM incident_types WHERE name = 'Vandalism' AND school_id = 1);

INSERT INTO incident_types (name, default_points, default_severity, description, is_active, school_id)
SELECT 'Cheating', 3, 'medium', 'Academic dishonesty during tests or assignments', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM incident_types WHERE name = 'Cheating' AND school_id = 1);

INSERT INTO incident_types (name, default_points, default_severity, description, is_active, school_id)
SELECT 'Disrespect to Staff', 3, 'medium', 'Rude or disrespectful behavior towards teachers or staff', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM incident_types WHERE name = 'Disrespect to Staff' AND school_id = 1);

INSERT INTO incident_types (name, default_points, default_severity, description, is_active, school_id)
SELECT 'Truancy', 3, 'medium', 'Unexcused absence from school or class', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM incident_types WHERE name = 'Truancy' AND school_id = 1);

INSERT INTO incident_types (name, default_points, default_severity, description, is_active, school_id)
SELECT 'Cell Phone Violation', 1, 'low', 'Unauthorized use of cell phone during class', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM incident_types WHERE name = 'Cell Phone Violation' AND school_id = 1);

INSERT INTO incident_types (name, default_points, default_severity, description, is_active, school_id)
SELECT 'Profanity', 2, 'medium', 'Use of inappropriate language', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM incident_types WHERE name = 'Profanity' AND school_id = 1);

-- ============================================
-- MERIT TYPES (Positive Behaviors)
-- ============================================

INSERT INTO merit_types (name, default_points, description, is_active, school_id)
SELECT 'Academic Excellence', 5, 'Outstanding academic achievement or improvement', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM merit_types WHERE name = 'Academic Excellence' AND school_id = 1);

INSERT INTO merit_types (name, default_points, description, is_active, school_id)
SELECT 'Helping Others', 3, 'Assisting classmates or staff members', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM merit_types WHERE name = 'Helping Others' AND school_id = 1);

INSERT INTO merit_types (name, default_points, description, is_active, school_id)
SELECT 'Good Citizenship', 2, 'Demonstrating positive school citizenship', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM merit_types WHERE name = 'Good Citizenship' AND school_id = 1);

INSERT INTO merit_types (name, default_points, description, is_active, school_id)
SELECT 'Perfect Attendance', 3, 'No absences or tardies for the period', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM merit_types WHERE name = 'Perfect Attendance' AND school_id = 1);

INSERT INTO merit_types (name, default_points, description, is_active, school_id)
SELECT 'Leadership', 4, 'Demonstrating leadership qualities', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM merit_types WHERE name = 'Leadership' AND school_id = 1);

INSERT INTO merit_types (name, default_points, description, is_active, school_id)
SELECT 'Sports Achievement', 3, 'Excellence in sports or physical education', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM merit_types WHERE name = 'Sports Achievement' AND school_id = 1);

INSERT INTO merit_types (name, default_points, description, is_active, school_id)
SELECT 'Community Service', 4, 'Participation in community service activities', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM merit_types WHERE name = 'Community Service' AND school_id = 1);

INSERT INTO merit_types (name, default_points, description, is_active, school_id)
SELECT 'Creativity', 2, 'Outstanding creative work in arts or projects', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM merit_types WHERE name = 'Creativity' AND school_id = 1);

INSERT INTO merit_types (name, default_points, description, is_active, school_id)
SELECT 'Improvement', 3, 'Significant improvement in behavior or academics', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM merit_types WHERE name = 'Improvement' AND school_id = 1);

INSERT INTO merit_types (name, default_points, description, is_active, school_id)
SELECT 'Respect', 2, 'Showing respect to peers and staff', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM merit_types WHERE name = 'Respect' AND school_id = 1);

-- ============================================
-- INTERVENTION TYPES
-- ============================================

INSERT INTO intervention_types (name, description, default_duration, is_active, school_id)
SELECT 'Counseling Session', 'One-on-one counseling with school counselor', 30, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM intervention_types WHERE name = 'Counseling Session' AND school_id = 1);

INSERT INTO intervention_types (name, description, default_duration, is_active, school_id)
SELECT 'Peer Mediation', 'Mediated discussion between students in conflict', 45, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM intervention_types WHERE name = 'Peer Mediation' AND school_id = 1);

INSERT INTO intervention_types (name, description, default_duration, is_active, school_id)
SELECT 'Parent Conference', 'Meeting with parents to discuss student behavior', 60, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM intervention_types WHERE name = 'Parent Conference' AND school_id = 1);

INSERT INTO intervention_types (name, description, default_duration, is_active, school_id)
SELECT 'Behavior Contract', 'Written agreement outlining expected behaviors', NULL, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM intervention_types WHERE name = 'Behavior Contract' AND school_id = 1);

INSERT INTO intervention_types (name, description, default_duration, is_active, school_id)
SELECT 'Academic Support', 'Extra tutoring or academic assistance', 60, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM intervention_types WHERE name = 'Academic Support' AND school_id = 1);

INSERT INTO intervention_types (name, description, default_duration, is_active, school_id)
SELECT 'Anger Management', 'Sessions focused on managing anger and emotions', 45, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM intervention_types WHERE name = 'Anger Management' AND school_id = 1);

INSERT INTO intervention_types (name, description, default_duration, is_active, school_id)
SELECT 'Social Skills Training', 'Training to improve social interactions', 45, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM intervention_types WHERE name = 'Social Skills Training' AND school_id = 1);

INSERT INTO intervention_types (name, description, default_duration, is_active, school_id)
SELECT 'Mentorship Program', 'Pairing with a mentor for guidance', NULL, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM intervention_types WHERE name = 'Mentorship Program' AND school_id = 1);

INSERT INTO intervention_types (name, description, default_duration, is_active, school_id)
SELECT 'Restorative Circle', 'Group discussion to repair harm and restore relationships', 60, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM intervention_types WHERE name = 'Restorative Circle' AND school_id = 1);

INSERT INTO intervention_types (name, description, default_duration, is_active, school_id)
SELECT 'Check-In/Check-Out', 'Daily check-ins with designated staff member', 10, 1, 1
WHERE NOT EXISTS (SELECT 1 FROM intervention_types WHERE name = 'Check-In/Check-Out' AND school_id = 1);

-- Verification
SELECT 'Incident Types:' as category, COUNT(*) as count FROM incident_types WHERE school_id = 1;
SELECT 'Merit Types:' as category, COUNT(*) as count FROM merit_types WHERE school_id = 1;
SELECT 'Intervention Types:' as category, COUNT(*) as count FROM intervention_types WHERE school_id = 1;
