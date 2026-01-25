require('dotenv').config();
const axios = require('axios');

async function testStudentsAPI() {
  try {
    console.log('🧪 Testing Students API Endpoint...\n');
    
    // You'll need to replace this with a valid JWT token from your browser
    // To get it: Login to the app, open DevTools -> Application -> Local Storage -> token
    const token = 'YOUR_JWT_TOKEN_HERE';
    
    console.log('Making request to http://localhost:5000/api/students');
    console.log('Note: You need to add a valid JWT token to this script\n');
    
    const response = await axios.get('http://localhost:5000/api/students', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Response Status:', response.status);
    console.log('📊 Students Count:', response.data.length);
    console.log('\nFirst 3 students:');
    response.data.slice(0, 3).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.first_name} ${s.last_name} (${s.student_id})`);
    });
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status);
      console.error('Error message:', error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

console.log('⚠️  To test the API endpoint, you need to:');
console.log('1. Login to the app in your browser');
console.log('2. Open DevTools (F12)');
console.log('3. Go to Application -> Local Storage');
console.log('4. Copy the "token" value');
console.log('5. Replace YOUR_JWT_TOKEN_HERE in this script');
console.log('6. Run this script again\n');

// testStudentsAPI();
