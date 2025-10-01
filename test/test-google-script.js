// Test script to verify Google Apps Script integration
require('dotenv').config({ path: './.env.local' });

async function testGoogleAppsScript() {
  const gasUrl = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL;
  
  if (!gasUrl) {
    console.error('❌ GOOGLE_APPS_SCRIPT_WEBHOOK_URL not found in environment variables');
    return;
  }
  
  console.log('🔗 Testing Google Apps Script URL:', gasUrl);
  
  const testData = {
    name: 'Test User',
    email: 'test@example.com',
    message: 'Thank you for signing up for Elite Sleep+',
    event_type: 'test',
    timestamp: new Date().toISOString()
  };
  
  try {
    console.log('📤 Sending test data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📊 Response status:', response.status, response.statusText);
    
    const responseText = await response.text();
    console.log('📄 Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Google Apps Script integration test successful!');
    } else {
      console.log('❌ Google Apps Script integration test failed');
    }
    
  } catch (error) {
    console.error('❌ Error testing Google Apps Script:', error.message);
  }
}

testGoogleAppsScript();