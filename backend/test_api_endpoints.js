const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// You'll need to replace this with a valid token from your browser
// To get token: Open browser console -> localStorage.getItem('token')
const TOKEN = 'YOUR_TOKEN_HERE';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    }
});

async function testEndpoints() {
    console.log('🧪 Testing API Endpoints...\n');
    console.log('='.repeat(60));
    
    const tests = [
        {
            name: 'Dashboard Stats',
            endpoint: '/analytics/dashboard',
            expectedFields: ['totalStudents', 'totalIncidents', 'totalMerits']
        },
        {
            name: 'Critical Alerts',
            endpoint: '/analytics/critical-alerts',
            expectedFields: ['thresholdStudents', 'classesWithoutAttendance']
        },
        {
            name: 'Students List',
            endpoint: '/students',
            expectedFields: ['students', 'pagination']
        },
        {
            name: 'Classes List',
            endpoint: '/classes',
            expectedFields: null // Just check if it returns array
        },
        {
            name: 'Teachers List',
            endpoint: '/teachers',
            expectedFields: null
        },
        {
            name: 'Detentions',
            endpoint: '/detentions',
            expectedFields: null
        },
        {
            name: 'Merits',
            endpoint: '/merits',
            expectedFields: null
        },
        {
            name: 'Behaviour Incidents',
            endpoint: '/behaviour',
            expectedFields: null
        }
    ];
    
    const results = {
        passed: [],
        failed: [],
        errors: []
    };
    
    for (const test of tests) {
        try {
            console.log(`\n📍 Testing: ${test.name}`);
            console.log(`   Endpoint: ${test.endpoint}`);
            
            const response = await api.get(test.endpoint);
            
            console.log(`   Status: ${response.status}`);
            console.log(`   Data keys: ${Object.keys(response.data).join(', ')}`);
            
            // Check for expected fields
            if (test.expectedFields) {
                const missing = test.expectedFields.filter(field => !(field in response.data));
                if (missing.length > 0) {
                    console.log(`   ⚠️  Missing fields: ${missing.join(', ')}`);
                }
            }
            
            // Show data summary
            if (Array.isArray(response.data)) {
                console.log(`   ✅ Returned ${response.data.length} items`);
            } else if (response.data.students) {
                console.log(`   ✅ Students count: ${response.data.students?.length || 0}`);
            } else if (response.data.totalStudents !== undefined) {
                console.log(`   ✅ Total students: ${response.data.totalStudents?.count || response.data.totalStudents}`);
            }
            
            results.passed.push(test.name);
            
        } catch (error) {
            console.log(`   ❌ FAILED`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Error: ${JSON.stringify(error.response.data)}`);
            } else {
                console.log(`   Error: ${error.message}`);
            }
            results.failed.push(test.name);
            results.errors.push({
                test: test.name,
                error: error.response?.data || error.message
            });
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 TEST RESULTS:\n');
    console.log(`✅ Passed: ${results.passed.length}/${tests.length}`);
    console.log(`❌ Failed: ${results.failed.length}/${tests.length}`);
    
    if (results.passed.length > 0) {
        console.log('\n✅ Passed tests:');
        results.passed.forEach(name => console.log(`   - ${name}`));
    }
    
    if (results.failed.length > 0) {
        console.log('\n❌ Failed tests:');
        results.failed.forEach(name => console.log(`   - ${name}`));
        
        console.log('\n📋 Error details:');
        results.errors.forEach(err => {
            console.log(`\n   ${err.test}:`);
            console.log(`   ${JSON.stringify(err.error, null, 2)}`);
        });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n💡 NOTE: If you see "YOUR_TOKEN_HERE" error, you need to:');
    console.log('   1. Open browser console');
    console.log('   2. Run: localStorage.getItem("token")');
    console.log('   3. Copy the token value');
    console.log('   4. Replace TOKEN in this script');
    console.log('   5. Run this script again\n');
}

testEndpoints().catch(err => {
    console.error('Test suite error:', err.message);
    process.exit(1);
});
