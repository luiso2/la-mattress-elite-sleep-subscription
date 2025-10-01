require('dotenv').config({ path: '.env.local' });
const https = require('https');
const http = require('http');

// Test data with the specific email
const testData = {
  type: 'customer.subscription.created',
  data: {
    object: {
      id: 'sub_test_12345',
      customer: 'cus_test_67890',
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days
      items: {
        data: [{
          price: {
            id: 'price_test_abc123',
            nickname: 'Test Plan',
            unit_amount: 2999
          }
        }]
      }
    }
  },
  customer_email: 'lbencomo94@gmail.com'
};

const googleScriptUrl = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL;

if (!googleScriptUrl) {
  console.error('❌ GOOGLE_APPS_SCRIPT_WEBHOOK_URL not found in environment variables');
  process.exit(1);
}

console.log('🚀 Sending test request to Google Apps Script...');
console.log('📧 Email:', testData.customer_email);
console.log('🔗 URL:', googleScriptUrl);

const postData = JSON.stringify(testData);
const url = new URL(googleScriptUrl);
const isHttps = url.protocol === 'https:';
const client = isHttps ? https : http;

const options = {
  hostname: url.hostname,
  port: url.port || (isHttps ? 443 : 80),
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = client.request(options, (res) => {
  console.log('📊 Status Code:', res.statusCode);
  
  // Handle redirects
  if (res.statusCode === 302 || res.statusCode === 301) {
    const redirectUrl = res.headers.location;
    console.log('🔄 Following redirect to:', redirectUrl);
    
    const redirectUrlObj = new URL(redirectUrl);
    const redirectIsHttps = redirectUrlObj.protocol === 'https:';
    const redirectClient = redirectIsHttps ? https : http;
    
    const redirectOptions = {
      hostname: redirectUrlObj.hostname,
      port: redirectUrlObj.port || (redirectIsHttps ? 443 : 80),
      path: redirectUrlObj.pathname + redirectUrlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const redirectReq = redirectClient.request(redirectOptions, (redirectRes) => {
      console.log('📊 Redirect Status Code:', redirectRes.statusCode);
      
      let data = '';
      redirectRes.on('data', (chunk) => {
        data += chunk;
      });
      
      redirectRes.on('end', () => {
        console.log('📝 Response:', data);
        if (redirectRes.statusCode === 200) {
          console.log('✅ Test request sent successfully!');
        } else {
          console.log('❌ Test request failed with status:', redirectRes.statusCode);
        }
      });
    });
    
    redirectReq.on('error', (error) => {
      console.error('❌ Error in redirect request:', error.message);
    });
    
    redirectReq.write(postData);
    redirectReq.end();
    return;
  }
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📝 Response:', data);
    if (res.statusCode === 200) {
      console.log('✅ Test request sent successfully!');
    } else {
      console.log('❌ Test request failed with status:', res.statusCode);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error sending request:', error.message);
});

req.write(postData);
req.end();