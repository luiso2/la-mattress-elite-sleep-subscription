// Test script to verify credit calculation logic
const jwt = require('jsonwebtoken');

// Create a test token
const token = jwt.sign(
  { 
    customerId: 'cus_test',
    email: 'julianne.bourne@yahoo.com',
    name: 'Julianne Bourne',
    hasActiveSubscription: true
  },
  'elite-sleep-jwt-secret-key-2024',
  { expiresIn: '1h' }
);

console.log('Test token created:', token);
console.log('\nTo test the portal data endpoint, run:');
console.log(`\ncurl -H "Authorization: Bearer ${token}" http://localhost:3000/api/portal/data`);