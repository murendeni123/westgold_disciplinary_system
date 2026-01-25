const { dbGet } = require('./database/db');
const { getCachedSchool } = require('./middleware/schemaContext');

async function testAuthFlow() {
    try {
        console.log('🧪 Testing authentication flow for User ID 1...\n');
        
        // Simulate what happens in authenticateToken middleware
        const userId = 1;
        
        // 1. Fetch user
        const user = await dbGet(
            'SELECT id, email, name, role, primary_school_id, is_active FROM public.users WHERE id = $1',
            [userId]
        );
        
        console.log('1️⃣ User fetched:', {
            id: user.id,
            email: user.email,
            role: user.role,
            primary_school_id: user.primary_school_id,
            is_active: user.is_active
        });
        
        // 2. Simulate token decode (old token without schemaName)
        const decoded = {
            userId: user.id,
            email: user.email,
            role: user.role,
            // No schoolId or schemaName in old tokens
        };
        
        console.log('\n2️⃣ Decoded token (simulated old token):', decoded);
        
        // 3. Try to get school context
        let schoolId = decoded.schoolId || user.primary_school_id;
        let schemaName = decoded.schemaName;
        let school = null;
        
        console.log('\n3️⃣ Initial values:', { schoolId, schemaName });
        
        // 4. Fetch school if needed
        if (!schemaName && schoolId) {
            console.log('\n4️⃣ Fetching school via getCachedSchool...');
            school = await getCachedSchool(schoolId, 'id');
            if (school) {
                schemaName = school.schema_name;
                console.log('✅ School found:', {
                    id: school.id,
                    name: school.name,
                    schema_name: school.schema_name
                });
            } else {
                console.log('❌ School not found');
            }
        }
        
        // 5. Try user_schools if still no context
        if (!schoolId || !schemaName) {
            console.log('\n5️⃣ Trying user_schools lookup...');
            const userSchool = await dbGet(`
                SELECT s.id, s.schema_name, s.name, s.code
                FROM public.schools s
                JOIN public.user_schools us ON s.id = us.school_id
                WHERE us.user_id = $1 AND us.is_primary = true
                LIMIT 1
            `, [user.id]);
            
            if (userSchool) {
                schoolId = userSchool.id;
                schemaName = userSchool.schema_name;
                school = userSchool;
                console.log('✅ School found via user_schools:', {
                    id: userSchool.id,
                    name: userSchool.name,
                    schema_name: userSchool.schema_name
                });
            } else {
                console.log('❌ No school found in user_schools');
            }
        }
        
        console.log('\n🎯 FINAL RESULT:', {
            schoolId,
            schemaName,
            schoolName: school?.name
        });
        
        // 6. Test schema validation
        const VALID_SCHEMA_PATTERN = /^school_[a-z0-9_]+$/;
        const isValid = schemaName && VALID_SCHEMA_PATTERN.test(schemaName);
        
        console.log('\n✅ Schema validation:', {
            schemaName,
            pattern: '^school_[a-z0-9_]+$',
            isValid,
            length: schemaName?.length
        });
        
        if (!isValid) {
            console.log('❌ PROBLEM: Schema name does not match validation pattern!');
        } else {
            console.log('✅ SUCCESS: Schema name is valid and should work!');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testAuthFlow();
