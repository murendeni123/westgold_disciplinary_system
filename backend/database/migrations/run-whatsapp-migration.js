/**
 * WhatsApp Notifications Migration Script
 * 
 * This script runs the WhatsApp notifications database migration.
 * It adds the necessary tables and columns for WhatsApp integration.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Check for DATABASE_URL
if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is required');
    console.error('Please set DATABASE_URL in your .env file');
    process.exit(1);
}

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('amazonaws.com') ? {
        rejectUnauthorized: false
    } : false,
});

async function runMigration() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Starting WhatsApp notifications migration...\n');
        
        // Read the migration SQL file
        const migrationPath = path.join(__dirname, 'add_whatsapp_notifications_pg.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Remove comments and split by semicolon
        const cleanSQL = migrationSQL
            .split('\n')
            .filter(line => !line.trim().startsWith('--'))
            .join('\n');
        
        const statements = cleanSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        
        console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
        
        let successCount = 0;
        let skipCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            // Skip comments
            if (statement.startsWith('--')) continue;
            
            try {
                await client.query(statement);
                successCount++;
                
                // Log progress for major operations
                if (statement.includes('CREATE TABLE')) {
                    const match = statement.match(/CREATE TABLE.*?(\w+)\s*\(/i);
                    if (match) {
                        console.log(`✅ Created table: ${match[1]}`);
                    }
                } else if (statement.includes('ALTER TABLE')) {
                    const match = statement.match(/ALTER TABLE\s+(\w+)/i);
                    if (match) {
                        console.log(`✅ Altered table: ${match[1]}`);
                    }
                } else if (statement.includes('CREATE INDEX')) {
                    const match = statement.match(/CREATE INDEX.*?(\w+)\s+ON/i);
                    if (match) {
                        console.log(`✅ Created index: ${match[1]}`);
                    }
                } else if (statement.includes('INSERT INTO')) {
                    const match = statement.match(/INSERT INTO\s+(\w+)/i);
                    if (match) {
                        console.log(`✅ Inserted data into: ${match[1]}`);
                    }
                }
            } catch (error) {
                // Ignore "already exists" errors
                if (error.message.includes('already exists') || 
                    error.message.includes('duplicate') ||
                    error.message.includes('column') && error.message.includes('already exists')) {
                    skipCount++;
                    // Silently skip
                } else {
                    console.error(`❌ Error executing statement ${i + 1}:`, error.message);
                    console.error('Statement:', statement.substring(0, 100) + '...');
                }
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ Migration completed successfully!');
        console.log('='.repeat(60));
        console.log(`📊 Summary:`);
        console.log(`   - Executed: ${successCount} statements`);
        console.log(`   - Skipped (already exists): ${skipCount} statements`);
        console.log('\n📋 Next steps:');
        console.log('   1. Set up WhatsApp Business Account in Meta Developer Console');
        console.log('   2. Add WhatsApp credentials to .env file:');
        console.log('      - WHATSAPP_ENABLED=true');
        console.log('      - WHATSAPP_TOKEN=your-access-token');
        console.log('      - WHATSAPP_PHONE_NUMBER_ID=your-phone-id');
        console.log('      - WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-id');
        console.log('   3. Create message templates in Meta Business Manager');
        console.log('   4. Restart your backend server\n');
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the migration
runMigration()
    .then(() => {
        console.log('✨ Done!\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
