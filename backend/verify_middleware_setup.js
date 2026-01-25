const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying middleware setup in route files...\n');

const routeFiles = [
    'routes/students.js',
    'routes/teachers.js',
    'routes/classes.js',
    'routes/behaviour.js',
    'routes/merits.js',
    'routes/attendance.js',
    'routes/detentions.js',
    'routes/analytics.js',
    'routes/messages.js',
    'routes/notifications.js'
];

const results = {
    hasAuth: [],
    missingAuth: [],
    hasSchoolContext: [],
    missingSchoolContext: [],
    usesSchemaHelpers: [],
    missingSchemaHelpers: []
};

routeFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⏭️  Skipping ${file} (not found)`);
        return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for authenticateToken
    const hasAuth = content.includes('authenticateToken') || content.includes('require(\'../middleware/auth\')');
    
    // Check for school context validation
    const hasSchoolContext = 
        content.includes('requireSchoolContext') ||
        content.includes('getSchema(req)') ||
        content.includes('req.schemaName');
    
    // Check for schema helper usage
    const usesSchemaHelpers = 
        content.includes('schemaAll') ||
        content.includes('schemaGet') ||
        content.includes('schemaRun');
    
    if (hasAuth) {
        results.hasAuth.push(file);
    } else {
        results.missingAuth.push(file);
    }
    
    if (hasSchoolContext) {
        results.hasSchoolContext.push(file);
    } else {
        results.missingSchoolContext.push(file);
    }
    
    if (usesSchemaHelpers) {
        results.usesSchemaHelpers.push(file);
    } else {
        results.missingSchemaHelpers.push(file);
    }
});

console.log('📊 MIDDLEWARE VERIFICATION RESULTS\n');
console.log('='.repeat(60));

console.log('\n✅ Routes with authenticateToken:');
results.hasAuth.forEach(f => console.log(`   - ${f}`));

if (results.missingAuth.length > 0) {
    console.log('\n❌ Routes MISSING authenticateToken:');
    results.missingAuth.forEach(f => console.log(`   - ${f}`));
}

console.log('\n✅ Routes with school context validation:');
results.hasSchoolContext.forEach(f => console.log(`   - ${f}`));

if (results.missingSchoolContext.length > 0) {
    console.log('\n⚠️  Routes that may need school context validation:');
    results.missingSchoolContext.forEach(f => console.log(`   - ${f}`));
}

console.log('\n✅ Routes using schema helpers (schemaAll/Get/Run):');
results.usesSchemaHelpers.forEach(f => console.log(`   - ${f}`));

if (results.missingSchemaHelpers.length > 0) {
    console.log('\n⚠️  Routes NOT using schema helpers:');
    results.missingSchemaHelpers.forEach(f => console.log(`   - ${f}`));
}

console.log('\n' + '='.repeat(60));
console.log('\n📋 SUMMARY:\n');

const authCoverage = (results.hasAuth.length / routeFiles.length * 100).toFixed(0);
const contextCoverage = (results.hasSchoolContext.length / routeFiles.length * 100).toFixed(0);
const helperCoverage = (results.usesSchemaHelpers.length / routeFiles.length * 100).toFixed(0);

console.log(`Authentication Coverage: ${authCoverage}% (${results.hasAuth.length}/${routeFiles.length})`);
console.log(`School Context Coverage: ${contextCoverage}% (${results.hasSchoolContext.length}/${routeFiles.length})`);
console.log(`Schema Helper Usage: ${helperCoverage}% (${results.usesSchemaHelpers.length}/${routeFiles.length})`);

if (results.missingAuth.length === 0 && results.missingSchoolContext.length === 0) {
    console.log('\n🎉 All critical routes have proper middleware setup!\n');
} else {
    console.log('\n⚠️  Some routes need attention. See details above.\n');
}

process.exit(0);
