const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let platformToken = null;

// Test platform login and get token
async function testLogin() {
    console.log('\n🔐 Testing Platform Login...');
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'superadmin@pds.com',
            password: 'superadmin123'
        });
        
        platformToken = response.data.token;
        console.log('✅ Login successful');
        console.log('   Token:', platformToken.substring(0, 20) + '...');
        console.log('   User:', response.data.user);
        return true;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        return false;
    }
}

// Test platform analytics
async function testAnalytics() {
    console.log('\n📊 Testing Platform Analytics...');
    try {
        const response = await axios.get(`${BASE_URL}/platform/analytics`, {
            headers: { Authorization: `Bearer ${platformToken}` }
        });
        console.log('✅ Analytics endpoint working');
        console.log('   Schools:', response.data.total_schools);
        console.log('   Users:', response.data.total_users);
        console.log('   Students:', response.data.total_students);
        return true;
    } catch (error) {
        console.error('❌ Analytics failed:', error.response?.data || error.message);
        return false;
    }
}

// Test platform schools
async function testSchools() {
    console.log('\n🏫 Testing Platform Schools...');
    try {
        const response = await axios.get(`${BASE_URL}/platform/schools`, {
            headers: { Authorization: `Bearer ${platformToken}` }
        });
        console.log('✅ Schools endpoint working');
        console.log('   Total schools:', response.data.length);
        if (response.data.length > 0) {
            console.log('   First school:', response.data[0].name);
        }
        return true;
    } catch (error) {
        console.error('❌ Schools failed:', error.response?.data || error.message);
        return false;
    }
}

// Test feature flags
async function testFeatureFlags() {
    console.log('\n🚩 Testing Feature Flags...');
    try {
        const response = await axios.get(`${BASE_URL}/feature-flags/all`, {
            headers: { Authorization: `Bearer ${platformToken}` }
        });
        console.log('✅ Feature flags endpoint working');
        console.log('   Total flags:', response.data.length);
        return true;
    } catch (error) {
        console.error('❌ Feature flags failed:', error.response?.data || error.message);
        return false;
    }
}

// Test school customizations
async function testCustomizations() {
    console.log('\n🎨 Testing School Customizations...');
    try {
        // Get first school ID
        const schoolsResponse = await axios.get(`${BASE_URL}/platform/schools`, {
            headers: { Authorization: `Bearer ${platformToken}` }
        });
        
        if (schoolsResponse.data.length === 0) {
            console.log('⚠️  No schools to test customizations');
            return true;
        }
        
        const schoolId = schoolsResponse.data[0].id;
        const response = await axios.get(`${BASE_URL}/school-customizations/${schoolId}`, {
            headers: { Authorization: `Bearer ${platformToken}` }
        });
        console.log('✅ School customizations endpoint working');
        console.log('   School ID:', schoolId);
        console.log('   Primary color:', response.data.primary_color);
        return true;
    } catch (error) {
        console.error('❌ Customizations failed:', error.response?.data || error.message);
        return false;
    }
}

// Test platform users
async function testPlatformUsers() {
    console.log('\n👥 Testing Platform Users...');
    try {
        const response = await axios.get(`${BASE_URL}/platform/users`, {
            headers: { Authorization: `Bearer ${platformToken}` }
        });
        console.log('✅ Platform users endpoint working');
        console.log('   Total users:', response.data.length);
        return true;
    } catch (error) {
        console.error('❌ Platform users failed:', error.response?.data || error.message);
        return false;
    }
}

// Test platform billing
async function testBilling() {
    console.log('\n💰 Testing Platform Billing...');
    try {
        const response = await axios.get(`${BASE_URL}/platform/billing`, {
            headers: { Authorization: `Bearer ${platformToken}` }
        });
        console.log('✅ Billing endpoint working');
        console.log('   Billing records:', response.data.length || 0);
        return true;
    } catch (error) {
        console.error('❌ Billing failed:', error.response?.data || error.message);
        return false;
    }
}

// Test platform logs
async function testLogs() {
    console.log('\n📝 Testing Platform Logs...');
    try {
        const response = await axios.get(`${BASE_URL}/platform/logs`, {
            headers: { Authorization: `Bearer ${platformToken}` }
        });
        console.log('✅ Logs endpoint working');
        console.log('   Log entries:', response.data.length || 0);
        return true;
    } catch (error) {
        console.error('❌ Logs failed:', error.response?.data || error.message);
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('═══════════════════════════════════════');
    console.log('   PLATFORM ADMIN API ENDPOINT TESTS   ');
    console.log('═══════════════════════════════════════');
    
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
        console.log('\n❌ Cannot proceed without valid login');
        process.exit(1);
    }
    
    const results = {
        analytics: await testAnalytics(),
        schools: await testSchools(),
        featureFlags: await testFeatureFlags(),
        customizations: await testCustomizations(),
        users: await testPlatformUsers(),
        billing: await testBilling(),
        logs: await testLogs()
    };
    
    console.log('\n═══════════════════════════════════════');
    console.log('              TEST SUMMARY              ');
    console.log('═══════════════════════════════════════');
    
    let passed = 0;
    let failed = 0;
    
    Object.entries(results).forEach(([test, success]) => {
        const status = success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} - ${test}`);
        if (success) passed++;
        else failed++;
    });
    
    console.log('\n───────────────────────────────────────');
    console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    console.log('═══════════════════════════════════════\n');
    
    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('\n💥 Unexpected error:', err);
    process.exit(1);
});
