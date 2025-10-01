require('dotenv').config({ path: '.env.local' });
const https = require('https');

// URL del webhook en producción
const PRODUCTION_WEBHOOK_URL = 'https://lamattressubscription.merktop.com/api/webhook/stripe';

// Datos de prueba para el webhook
const testData = {
  id: 'evt_test_webhook',
  object: 'event',
  api_version: '2020-08-27',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'sub_test_production',
      object: 'subscription',
      customer: 'cus_test_production',
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 2592000, // +30 días
      items: {
        data: [{
          id: 'si_test_production',
          price: {
            id: 'price_test_production',
            nickname: 'Elite Sleep+ Monthly'
          }
        }]
      },
      metadata: {
        customer_email: 'test@production.com',
        customer_name: 'Test Production User'
      }
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_test_production',
    idempotency_key: null
  },
  type: 'customer.subscription.created'
};

console.log('🚀 Testeando webhook en producción...');
console.log('URL:', PRODUCTION_WEBHOOK_URL);
console.log('Datos de prueba:', JSON.stringify(testData, null, 2));

const postData = JSON.stringify(testData);

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Stripe-Signature': 'test_signature' // Firma de prueba
  }
};

const req = https.request(PRODUCTION_WEBHOOK_URL, options, (res) => {
  console.log('\n📊 Respuesta del servidor:');
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📝 Contenido de la respuesta:');
    try {
      const parsedData = JSON.parse(responseData);
      console.log(JSON.stringify(parsedData, null, 2));
    } catch (e) {
      console.log(responseData);
    }
    
    if (res.statusCode === 200) {
      console.log('\n✅ Test del webhook en producción exitoso!');
    } else {
      console.log('\n❌ Test del webhook en producción falló');
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Error en la petición:', error.message);
});

req.write(postData);
req.end();