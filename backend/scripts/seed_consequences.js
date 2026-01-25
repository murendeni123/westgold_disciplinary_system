require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function seedConsequences() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding default consequences...\n');
    
    const schemasResult = await client.query(
      'SELECT schema_name FROM public.schools WHERE schema_name IS NOT NULL ORDER BY schema_name'
    );
    
    const defaultConsequences = [
      {
        name: 'Verbal Warning',
        consequence_type: 'verbal_warning',
        description: 'A verbal warning given to the student for minor infractions',
        severity: 'low',
        requires_admin_approval: false,
        is_active: true
      },
      {
        name: 'Written Warning',
        consequence_type: 'written_warning',
        description: 'A formal written warning documented in the student record',
        severity: 'medium',
        requires_admin_approval: false,
        is_active: true
      },
      {
        name: 'Suspension',
        consequence_type: 'suspension',
        description: 'Temporary removal from school for serious infractions',
        severity: 'high',
        requires_admin_approval: true,
        is_active: true
      }
    ];
    
    for (const schema of schemasResult.rows) {
      const schemaName = schema.schema_name;
      console.log(`📁 Processing schema: ${schemaName}`);
      
      // Check if consequences already exist
      const existingResult = await client.query(
        `SELECT COUNT(*) as count FROM ${schemaName}.consequences`
      );
      
      const existingCount = parseInt(existingResult.rows[0].count);
      
      if (existingCount > 0) {
        console.log(`   ⚠️  Already has ${existingCount} consequence(s), skipping...\n`);
        continue;
      }
      
      // Insert default consequences
      for (const consequence of defaultConsequences) {
        await client.query(`
          INSERT INTO ${schemaName}.consequences 
          (name, consequence_type, description, severity, requires_admin_approval, is_active)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          consequence.name,
          consequence.consequence_type,
          consequence.description,
          consequence.severity,
          consequence.requires_admin_approval,
          consequence.is_active
        ]);
        
        console.log(`   ✅ Created: ${consequence.name}`);
      }
      console.log('');
    }
    
    console.log('✅ Seeding complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

seedConsequences();
