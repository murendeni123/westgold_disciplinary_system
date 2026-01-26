/**
 * Check actual column names in Westgold schema
 */

require('dotenv').config();
const { pool } = require('../database/db');

async function checkColumns() {
    const client = await pool.connect();
    try {
        // Get incident_types columns
        const incidentCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'school_lear_1291' 
            AND table_name = 'incident_types'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 incident_types columns:');
        incidentCols.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });
        
        // Get merit_types columns
        const meritCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'school_lear_1291' 
            AND table_name = 'merit_types'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 merit_types columns:');
        meritCols.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });
        
        // Get intervention_types columns
        const interventionCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'school_lear_1291' 
            AND table_name = 'intervention_types'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 intervention_types columns:');
        interventionCols.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });
        
    } finally {
        client.release();
        process.exit(0);
    }
}

checkColumns();
