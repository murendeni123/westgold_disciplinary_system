// Migration script to add school customizations table
// This script only works with PostgreSQL

const { dbRun, dbGet } = require('./db');

const migrateSchoolCustomizations = async () => {
  try {
    console.log('Creating school_customizations table...');

    // Check if table exists in PostgreSQL
    const result = await dbGet(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'school_customizations'
      )
    `);
    
    const tableExists = result?.exists || false;

    if (!tableExists) {
      // PostgreSQL version
      await dbRun(`
        CREATE TABLE IF NOT EXISTS school_customizations (
          id SERIAL PRIMARY KEY,
          school_id INTEGER NOT NULL UNIQUE,
          
          -- Branding
          logo_path TEXT,
          favicon_path TEXT,
          login_background_path TEXT,
          dashboard_background_path TEXT,
          
          -- Colors
          primary_color TEXT DEFAULT '#3b82f6',
          secondary_color TEXT DEFAULT '#8b5cf6',
          success_color TEXT DEFAULT '#10b981',
          warning_color TEXT DEFAULT '#f59e0b',
          danger_color TEXT DEFAULT '#ef4444',
          background_color TEXT DEFAULT '#f9fafb',
          text_primary_color TEXT DEFAULT '#111827',
          text_secondary_color TEXT DEFAULT '#6b7280',
          
          -- Typography
          primary_font TEXT DEFAULT 'Inter',
          secondary_font TEXT DEFAULT 'Inter',
          base_font_size TEXT DEFAULT '16px',
          
          -- UI Components
          button_border_radius TEXT DEFAULT '8px',
          card_border_radius TEXT DEFAULT '12px',
          sidebar_background TEXT DEFAULT '#ffffff',
          header_background TEXT DEFAULT '#ffffff',
          
          -- Login Page
          login_welcome_message TEXT,
          login_tagline TEXT,
          login_background_color TEXT DEFAULT '#ffffff',
          
          -- Content
          contact_email TEXT,
          contact_phone TEXT,
          support_email TEXT,
          terms_url TEXT,
          privacy_url TEXT,
          
          -- Advanced
          custom_css TEXT,
          custom_js TEXT,
          
          -- Metadata
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ school_customizations table created (PostgreSQL)');
    } else {
      console.log('⚠️  school_customizations table already exists (PostgreSQL)');
    }

    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  migrateSchoolCustomizations()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateSchoolCustomizations;
