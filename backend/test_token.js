const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const JWT_SECRET = process.env.JWT_SECRET;

// Get token from command line argument
const token = process.argv[2];

if (!token) {
  console.log('Usage: node test_token.js <JWT_TOKEN>');
  console.log('\nTo get your token:');
  console.log('1. Open browser console (F12)');
  console.log('2. Run: localStorage.getItem("token")');
  console.log('3. Copy the token and pass it as argument');
  process.exit(1);
}

try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('✅ Token is valid\n');
  console.log('📋 Token payload:');
  console.log(JSON.stringify(decoded, null, 2));
  
  console.log('\n🔍 Key fields:');
  console.log('  userId:', decoded.userId);
  console.log('  email:', decoded.email);
  console.log('  role:', decoded.role);
  console.log('  schoolId:', decoded.schoolId || '❌ MISSING');
  console.log('  schemaName:', decoded.schemaName || '❌ MISSING');
  console.log('  schoolCode:', decoded.schoolCode || '❌ MISSING');
  
  if (!decoded.schemaName) {
    console.log('\n⚠️  WARNING: Token is missing schemaName!');
    console.log('This will cause "School context required" errors.');
    console.log('\nSolution: Logout and login again to get a fresh token with schema info.');
  }
  
} catch (error) {
  console.error('❌ Token verification failed:', error.message);
}
