/**
 * Test script to verify password sanitization behavior
 */

const validator = require('validator');

// Simulate the old sanitization behavior
const sanitizeStringOld = (input) => {
    let sanitized = input.trim();
    sanitized = validator.stripLow(sanitized);
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    sanitized = validator.escape(sanitized);
    return sanitized;
};

// Test passwords
const testPasswords = [
    'SimplePass123',
    'Pass<123>',
    'My&Password',
    'Test"Quote"',
    "Test'Single'",
    'Normal@Pass#123'
];

console.log('\n=== Password Sanitization Test ===\n');

testPasswords.forEach(password => {
    const escaped = sanitizeStringOld(password);
    const changed = password !== escaped;
    
    console.log(`Original:  ${password}`);
    console.log(`Escaped:   ${escaped}`);
    console.log(`Changed:   ${changed ? '❌ YES' : '✅ NO'}`);
    console.log('---');
});

console.log('\n=== Characters that get escaped ===');
console.log('< becomes &lt;');
console.log('> becomes &gt;');
console.log('& becomes &amp;');
console.log('" becomes &quot;');
console.log("' becomes &#x27;");
console.log('/ becomes &#x2F;');
