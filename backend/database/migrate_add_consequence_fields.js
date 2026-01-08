// Migration script to add parent acknowledgment and completion verification fields to student_consequences table

const { dbRun, dbGet } = require('./db');

const migrateAddConsequenceFields = async () => {
  try {
    console.log('Adding parent acknowledgment and completion verification fields to student_consequences table...');

    const usePostgres = !!process.env.DATABASE_URL;

    // Check if columns already exist
    let parentAcknowledgedExists = false;
    let completionVerifiedExists = false;

    if (usePostgres) {
      const result = await dbGet(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'student_consequences' 
        AND column_name IN ('parent_acknowledged', 'completion_verified')
      `);
      
      const existingColumns = result ? [result.column_name] : [];
      if (Array.isArray(result)) {
        existingColumns.push(...result.map(r => r.column_name));
      }
      
      parentAcknowledgedExists = existingColumns.includes('parent_acknowledged');
      completionVerifiedExists = existingColumns.includes('completion_verified');
    } else {
      // SQLite - check pragma
      const tableInfo = await dbGet(`PRAGMA table_info(student_consequences)`);
      if (tableInfo) {
        const columns = Array.isArray(tableInfo) ? tableInfo : [tableInfo];
        parentAcknowledgedExists = columns.some((col: any) => col.name === 'parent_acknowledged');
        completionVerifiedExists = columns.some((col: any) => col.name === 'completion_verified');
      }
    }

    if (!parentAcknowledgedExists) {
      if (usePostgres) {
        await dbRun(`ALTER TABLE student_consequences ADD COLUMN parent_acknowledged INTEGER DEFAULT 0`);
        await dbRun(`ALTER TABLE student_consequences ADD COLUMN parent_acknowledged_at TIMESTAMP`);
        await dbRun(`ALTER TABLE student_consequences ADD COLUMN parent_notes TEXT`);
      } else {
        await dbRun(`ALTER TABLE student_consequences ADD COLUMN parent_acknowledged INTEGER DEFAULT 0`);
        await dbRun(`ALTER TABLE student_consequences ADD COLUMN parent_acknowledged_at DATETIME`);
        await dbRun(`ALTER TABLE student_consequences ADD COLUMN parent_notes TEXT`);
      }
      console.log('✅ Added parent acknowledgment fields');
    }

    if (!completionVerifiedExists) {
      if (usePostgres) {
        await dbRun(`ALTER TABLE student_consequences ADD COLUMN completion_verified INTEGER DEFAULT 0`);
        await dbRun(`ALTER TABLE student_consequences ADD COLUMN completion_verified_by INTEGER`);
        await dbRun(`ALTER TABLE student_consequences ADD COLUMN completion_verified_at TIMESTAMP`);
      } else {
        await dbRun(`ALTER TABLE student_consequences ADD COLUMN completion_verified INTEGER DEFAULT 0`);
        await dbRun(`ALTER TABLE student_consequences ADD COLUMN completion_verified_by INTEGER`);
        await dbRun(`ALTER TABLE student_consequences ADD COLUMN completion_verified_at DATETIME`);
      }
      console.log('✅ Added completion verification fields');
    }

    if (parentAcknowledgedExists && completionVerifiedExists) {
      console.log('⚠️  Consequence fields already exist');
    }

    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  migrateAddConsequenceFields()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateAddConsequenceFields;

