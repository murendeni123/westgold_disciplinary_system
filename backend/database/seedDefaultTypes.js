/**
 * Seed Default Types for New Schools
 * 
 * This module seeds predefined incident types, merit types, interventions,
 * and detention rules for newly created schools.
 */

const { pool } = require('./db');

/**
 * Seed default incident types, merit types, and interventions for a school
 * @param {number} schoolId - The school ID
 * @param {string} schemaName - The school's schema name
 * @returns {Promise<{success: boolean, counts?: object, error?: string}>}
 */
const seedDefaultTypes = async (schoolId, schemaName) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Set search path to the school's schema
        await client.query(`SET search_path TO ${schemaName}, public`);
        
        const counts = {
            incidentTypes: 0,
            meritTypes: 0,
            interventionTypes: 0
        };
        
        // ============================================
        // INCIDENT TYPES (Behaviour/Demerit Types)
        // ============================================
        const incidentTypes = [
            { name: 'Late to Class', points: 1, severity: 'low', description: 'Student arrives late to class without valid excuse' },
            { name: 'Disruptive Behavior', points: 2, severity: 'medium', description: 'Disrupting class activities or other students' },
            { name: 'Incomplete Homework', points: 1, severity: 'low', description: 'Failure to complete assigned homework' },
            { name: 'Uniform Violation', points: 1, severity: 'low', description: 'Not wearing proper school uniform' },
            { name: 'Bullying', points: 5, severity: 'high', description: 'Physical or verbal bullying of other students' },
            { name: 'Fighting', points: 5, severity: 'high', description: 'Physical altercation with another student' },
            { name: 'Vandalism', points: 4, severity: 'high', description: 'Intentional damage to school property' },
            { name: 'Cheating', points: 3, severity: 'medium', description: 'Academic dishonesty during tests or assignments' },
            { name: 'Disrespect to Staff', points: 3, severity: 'medium', description: 'Rude or disrespectful behavior towards teachers or staff' },
            { name: 'Truancy', points: 3, severity: 'medium', description: 'Unexcused absence from school or class' },
            { name: 'Cell Phone Violation', points: 1, severity: 'low', description: 'Unauthorized use of cell phone during class' },
            { name: 'Profanity', points: 2, severity: 'medium', description: 'Use of inappropriate language' }
        ];
        
        for (const type of incidentTypes) {
            const existing = await client.query(
                `SELECT id FROM incident_types WHERE name = $1`,
                [type.name]
            );
            if (existing.rows.length === 0) {
                await client.query(`
                    INSERT INTO incident_types (name, points, severity, description, is_active)
                    VALUES ($1, $2, $3, $4, true)
                `, [type.name, type.points, type.severity, type.description]);
                counts.incidentTypes++;
            }
        }
        
        // ============================================
        // MERIT TYPES (Positive Behaviors)
        // ============================================
        const meritTypes = [
            { name: 'Academic Excellence', points: 5, description: 'Outstanding academic achievement or improvement' },
            { name: 'Helping Others', points: 3, description: 'Assisting classmates or staff members' },
            { name: 'Good Citizenship', points: 2, description: 'Demonstrating positive school citizenship' },
            { name: 'Perfect Attendance', points: 3, description: 'No absences or tardies for the period' },
            { name: 'Leadership', points: 4, description: 'Demonstrating leadership qualities' },
            { name: 'Sports Achievement', points: 3, description: 'Excellence in sports or physical education' },
            { name: 'Community Service', points: 4, description: 'Participation in community service activities' },
            { name: 'Creativity', points: 2, description: 'Outstanding creative work in arts or projects' },
            { name: 'Improvement', points: 3, description: 'Significant improvement in behavior or academics' },
            { name: 'Respect', points: 2, description: 'Showing respect to peers and staff' }
        ];
        
        for (const type of meritTypes) {
            const existing = await client.query(
                `SELECT id FROM merit_types WHERE name = $1`,
                [type.name]
            );
            if (existing.rows.length === 0) {
                await client.query(`
                    INSERT INTO merit_types (name, points, description, is_active)
                    VALUES ($1, $2, $3, true)
                `, [type.name, type.points, type.description]);
                counts.meritTypes++;
            }
        }
        
        // ============================================
        // INTERVENTION TYPES
        // ============================================
        const interventionTypes = [
            { name: 'Counseling Session', description: 'One-on-one counseling with school counselor', duration: 30 },
            { name: 'Peer Mediation', description: 'Mediated discussion between students in conflict', duration: 45 },
            { name: 'Parent Conference', description: 'Meeting with parents to discuss student behavior', duration: 60 },
            { name: 'Behavior Contract', description: 'Written agreement outlining expected behaviors', duration: null },
            { name: 'Academic Support', description: 'Extra tutoring or academic assistance', duration: 60 },
            { name: 'Anger Management', description: 'Sessions focused on managing anger and emotions', duration: 45 },
            { name: 'Social Skills Training', description: 'Training to improve social interactions', duration: 45 },
            { name: 'Mentorship Program', description: 'Pairing with a mentor for guidance', duration: null },
            { name: 'Restorative Circle', description: 'Group discussion to repair harm and restore relationships', duration: 60 },
            { name: 'Check-In/Check-Out', description: 'Daily check-ins with designated staff member', duration: 10 }
        ];
        
        for (const type of interventionTypes) {
            const existing = await client.query(
                `SELECT id FROM intervention_types WHERE name = $1`,
                [type.name]
            );
            if (existing.rows.length === 0) {
                await client.query(`
                    INSERT INTO intervention_types (name, description, default_duration, is_active, school_id)
                    VALUES ($1, $2, $3, true, $4)
                `, [type.name, type.description, type.duration, schoolId]);
                counts.interventionTypes++;
            }
        }
        
        await client.query('COMMIT');
        
        console.log(`✅ Seeded default types for school ${schoolId}:`, counts);
        
        return {
            success: true,
            counts
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error seeding default types for school ${schoolId}:`, error.message);
        return {
            success: false,
            error: error.message
        };
    } finally {
        client.release();
    }
};

module.exports = {
    seedDefaultTypes
};
