// Script to create sample users (parents, teachers, and school admins) in the database

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { dbRun, dbGet, dbAll } = require('./db');

const createSampleUsers = async () => {
  try {
    console.log('🌱 Starting user seed process...\n');

    // First, check if we have any schools, if not create one
    let school = await dbGet('SELECT * FROM schools LIMIT 1');
    
    if (!school) {
      console.log('📚 No school found. Creating a sample school...');
      const schoolResult = await dbRun(
        `INSERT INTO schools (name, email, status) 
         VALUES (?, ?, 'active') RETURNING id`,
        ['Demo School', 'demo@school.com']
      );
      school = await dbGet('SELECT * FROM schools WHERE id = ?', [schoolResult.id]);
      console.log(`✅ Created school: ${school.name} (ID: ${school.id})\n`);
    } else {
      console.log(`✅ Using existing school: ${school.name} (ID: ${school.id})\n`);
    }

    const schoolId = school.id;

    // Define users to create
    const usersToCreate = [
      // School Admin
      {
        email: 'admin@school.com',
        password: 'admin123',
        name: 'School Administrator',
        role: 'admin',
        school_id: schoolId
      },
      // Teachers
      {
        email: 'teacher1@school.com',
        password: 'teacher123',
        name: 'John Teacher',
        role: 'teacher',
        school_id: schoolId,
        employee_id: 'EMP-001',
        phone: '+1234567890'
      },
      {
        email: 'teacher2@school.com',
        password: 'teacher123',
        name: 'Jane Teacher',
        role: 'teacher',
        school_id: schoolId,
        employee_id: 'EMP-002',
        phone: '+1234567891'
      },
      // Parents
      {
        email: 'parent1@school.com',
        password: 'parent123',
        name: 'Parent One',
        role: 'parent',
        school_id: schoolId,
        phone: '+1234567892',
        emergency_contact: '+1234567893',
        address: '123 Main Street, City, State 12345'
      },
      {
        email: 'parent2@school.com',
        password: 'parent123',
        name: 'Parent Two',
        role: 'parent',
        school_id: schoolId,
        phone: '+1234567894',
        emergency_contact: '+1234567895',
        address: '456 Oak Avenue, City, State 12345'
      }
    ];

    const createdUsers = [];
    const skippedUsers = [];

    for (const userData of usersToCreate) {
      try {
        // Check if user already exists
        const existing = await dbGet('SELECT id, email FROM users WHERE email = ?', [userData.email]);
        
        if (existing) {
          console.log(`⏭️  User already exists: ${userData.email}`);
          skippedUsers.push(userData);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Create user in users table
        const userResult = await dbRun(
          `INSERT INTO users (email, password, role, name, school_id) 
           VALUES (?, ?, ?, ?, ?) RETURNING id`,
          [userData.email, hashedPassword, userData.role, userData.name, userData.school_id]
        );

        const userId = userResult.id;

        // Create role-specific records
        if (userData.role === 'teacher') {
          // Create teacher record
          const employeeId = userData.employee_id || `EMP-${userId}-${Date.now()}`;
          await dbRun(
            `INSERT INTO teachers (user_id, employee_id, phone, school_id) 
             VALUES (?, ?, ?, ?)`,
            [userId, employeeId, userData.phone || null, schoolId]
          );
          console.log(`✅ Created teacher: ${userData.name} (${userData.email}) - Employee ID: ${employeeId}`);
        } else if (userData.role === 'parent') {
          // Check if parents table exists and has the required columns
          try {
            // Create parent record with correct column names
            await dbRun(
              `INSERT INTO parents (user_id, phone, emergency_contact_phone, home_address, school_id) 
               VALUES (?, ?, ?, ?, ?)`,
              [
                userId, 
                userData.phone || null, 
                userData.emergency_contact || null, 
                userData.address || null,
                schoolId
              ]
            );
            console.log(`✅ Created parent: ${userData.name} (${userData.email})`);
          } catch (parentError) {
            // If parents table doesn't exist or has different structure, just log
            console.log(`⚠️  Could not create parent record (table may not exist): ${parentError.message}`);
            console.log(`✅ Created parent user: ${userData.name} (${userData.email})`);
          }
        } else if (userData.role === 'admin') {
          console.log(`✅ Created admin: ${userData.name} (${userData.email})`);
        }

        createdUsers.push({
          ...userData,
          id: userId,
          password: userData.password // Keep original password for display
        });

      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }

    // Display summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 USER CREDENTIALS SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (createdUsers.length > 0) {
      console.log('✅ NEWLY CREATED USERS:\n');
      
      const byRole = {
        admin: [],
        teacher: [],
        parent: []
      };

      createdUsers.forEach(user => {
        byRole[user.role] = byRole[user.role] || [];
        byRole[user.role].push(user);
      });

      if (byRole.admin.length > 0) {
        console.log('👨‍💼 SCHOOL ADMINS:');
        byRole.admin.forEach(user => {
          console.log(`   Email: ${user.email}`);
          console.log(`   Password: ${user.password}`);
          console.log(`   Name: ${user.name}`);
          console.log('');
        });
      }

      if (byRole.teacher.length > 0) {
        console.log('👩‍🏫 TEACHERS:');
        byRole.teacher.forEach(user => {
          console.log(`   Email: ${user.email}`);
          console.log(`   Password: ${user.password}`);
          console.log(`   Name: ${user.name}`);
          console.log(`   Employee ID: ${user.employee_id || 'N/A'}`);
          console.log('');
        });
      }

      if (byRole.parent.length > 0) {
        console.log('👨‍👩‍👧 PARENTS:');
        byRole.parent.forEach(user => {
          console.log(`   Email: ${user.email}`);
          console.log(`   Password: ${user.password}`);
          console.log(`   Name: ${user.name}`);
          console.log('');
        });
      }
    }

    if (skippedUsers.length > 0) {
      console.log(`\n⏭️  SKIPPED (already exist): ${skippedUsers.length} users\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n✅ Seed process completed!`);
    console.log(`   Created: ${createdUsers.length} users`);
    console.log(`   Skipped: ${skippedUsers.length} users`);
    console.log(`   School: ${school.name} (ID: ${school.id})\n`);

  } catch (error) {
    console.error('❌ Error in seed process:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  createSampleUsers()
    .then(() => {
      console.log('Setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = createSampleUsers;

