// Migration script to add email template fields to school_customizations table

const { dbRun, dbGet } = require('./db');

const migrateAddEmailTemplates = async () => {
  try {
    console.log('Adding email template fields to school_customizations table...');

    const usePostgres = !!process.env.DATABASE_URL;

    // Check if columns already exist
    let emailHeaderExists = false;
    let emailFooterExists = false;
    let emailSignatureExists = false;

    if (usePostgres) {
      const result = await dbGet(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'school_customizations' 
        AND column_name IN ('email_header_html', 'email_footer_html', 'email_signature')
      `);
      
      const existingColumns = result ? [result.column_name] : [];
      if (Array.isArray(result)) {
        existingColumns.push(...result.map(r => r.column_name));
      }
      
      emailHeaderExists = existingColumns.includes('email_header_html');
      emailFooterExists = existingColumns.includes('email_footer_html');
      emailSignatureExists = existingColumns.includes('email_signature');
    } else {
      // SQLite - check pragma
      const tableInfo = await dbGet(`PRAGMA table_info(school_customizations)`);
      if (tableInfo) {
        const columns = Array.isArray(tableInfo) ? tableInfo : [tableInfo];
        emailHeaderExists = columns.some((col: any) => col.name === 'email_header_html');
        emailFooterExists = columns.some((col: any) => col.name === 'email_footer_html');
        emailSignatureExists = columns.some((col: any) => col.name === 'email_signature');
      }
    }

    if (!emailHeaderExists) {
      await dbRun(`ALTER TABLE school_customizations ADD COLUMN email_header_html TEXT`);
      console.log('✅ Added email_header_html column');
    }

    if (!emailFooterExists) {
      await dbRun(`ALTER TABLE school_customizations ADD COLUMN email_footer_html TEXT`);
      console.log('✅ Added email_footer_html column');
    }

    if (!emailSignatureExists) {
      await dbRun(`ALTER TABLE school_customizations ADD COLUMN email_signature TEXT`);
      console.log('✅ Added email_signature column');
    }

    if (emailHeaderExists && emailFooterExists && emailSignatureExists) {
      console.log('⚠️  Email template columns already exist');
    }

    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  migrateAddEmailTemplates()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateAddEmailTemplates;

