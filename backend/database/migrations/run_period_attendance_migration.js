#!/usr/bin/env node

/**
 * Migration Runner for Per-Period Attendance System
 * 
 * This script creates the per-period attendance tables in all active school schemas
 * Run with: node run_period_attendance_migration.js
 */

require('dotenv').config();
const { pool } = require('../db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('\n========================================');
    console.log('🚀 Per-Period Attendance System Migration');
    console.log('========================================\n');

    const client = await pool.connect();
    
    try {
        // Read the SQL migration file
        const sqlPath = path.join(__dirname, 'create_period_attendance_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Get all schools
        const schoolsResult = await client.query(
            'SELECT id, name, schema_name FROM public.schools ORDER BY id'
        );

        const schools = schoolsResult.rows;
        console.log(`Found ${schools.length} active school(s)\n`);

        for (const school of schools) {
            console.log(`\n📚 Migrating: ${school.name} (${school.schema_name})`);
            console.log('─'.repeat(50));

            try {
                // Set search path to school schema
                await client.query(`SET search_path TO ${school.schema_name}, public`);

                // Execute the migration SQL
                await client.query(sql);

                console.log('✅ Migration completed successfully');

                // Verify tables were created
                const tablesResult = await client.query(`
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = $1 
                    AND table_name IN (
                        'timetable_templates',
                        'time_slots',
                        'subjects',
                        'classrooms',
                        'class_timetables',
                        'period_sessions',
                        'period_attendance_records',
                        'student_dismissals',
                        'student_late_arrivals',
                        'attendance_flags',
                        'period_attendance_audit_log'
                    )
                    ORDER BY table_name
                `, [school.schema_name]);

                console.log(`\n📋 Tables created (${tablesResult.rows.length}/11):`);
                tablesResult.rows.forEach(row => {
                    console.log(`   ✓ ${row.table_name}`);
                });

                // Check functions
                const functionsResult = await client.query(`
                    SELECT routine_name 
                    FROM information_schema.routines 
                    WHERE routine_schema = $1 
                    AND routine_name IN (
                        'check_teacher_clash',
                        'check_room_clash',
                        'get_or_create_period_session',
                        'audit_log_trigger_func'
                    )
                    ORDER BY routine_name
                `, [school.schema_name]);

                console.log(`\n⚙️  Functions created (${functionsResult.rows.length}/4):`);
                functionsResult.rows.forEach(row => {
                    console.log(`   ✓ ${row.routine_name}`);
                });

            } catch (error) {
                console.error(`❌ Error migrating ${school.name}:`, error.message);
                console.error('Stack:', error.stack);
            }
        }

        // Reset search path
        await client.query('SET search_path TO public');

        console.log('\n========================================');
        console.log('✅ Migration Complete');
        console.log('========================================\n');

        console.log('Next Steps:');
        console.log('1. Create timetable templates via Admin UI');
        console.log('2. Define time slots for each template');
        console.log('3. Assign class timetables');
        console.log('4. Teachers can start marking attendance per period\n');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migration
runMigration().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
