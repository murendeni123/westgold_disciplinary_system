/**
 * Seed predefined types for Learskool Westgold Primary
 * Run this script to add default incident types, merit types, and interventions
 */

require('dotenv').config();
const { seedDefaultTypes } = require('../database/seedDefaultTypes');
const { dbGet } = require('../database/db');

async function seedWestgoldTypes() {
    try {
        console.log('🔍 Finding Learskool Westgold Primary school...');
        
        // Find the school
        const school = await dbGet(`
            SELECT id, name, schema_name 
            FROM public.schools 
            WHERE name ILIKE '%westgold%' OR name ILIKE '%learskool%'
            ORDER BY created_at DESC
            LIMIT 1
        `);
        
        if (!school) {
            console.error('❌ Learskool Westgold Primary school not found');
            process.exit(1);
        }
        
        console.log(`✅ Found school: ${school.name} (ID: ${school.id}, Schema: ${school.schema_name})`);
        console.log('📦 Seeding predefined types...');
        
        // Seed the types
        const result = await seedDefaultTypes(school.id, school.schema_name);
        
        if (result.success) {
            console.log('✅ Successfully seeded predefined types!');
            console.log('📊 Counts:', result.counts);
            console.log('\nTypes added:');
            console.log(`  - ${result.counts.incidentTypes} Incident Types`);
            console.log(`  - ${result.counts.meritTypes} Merit Types`);
            console.log(`  - ${result.counts.interventionTypes} Intervention Types`);
        } else {
            console.error('❌ Failed to seed types:', result.error);
            process.exit(1);
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the script
seedWestgoldTypes();
