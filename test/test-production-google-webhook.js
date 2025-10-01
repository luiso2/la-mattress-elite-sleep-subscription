require('dotenv').config({ path: '.env.local' });
const https = require('https');

// URL del Google Apps Script desde las variables de entorno
const GOOGLE_WEBHOOK_URL = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL;

if (!GOOGLE_WEBHOOK_URL) {
  console.error('❌ GOOGLE_APPS_SCRIPT_WEBHOOK_URL no encontrada en las variables de entorno');
  process.exit(1);
}

// Datos de prueba para el webhook de Google Apps Script
const testData = {
  type: 'customer.subscription.created',
  customer: {
    id: 'cus_test_production',
    email: 'test@production.com',
    name: 'Test Production User'
  },
  subscription: {
    id: 'sub_test_production',
    status: 'active',
    current_period_start: Math.floor(Date.now() / 1000),
    current_period_end: Math.floor(Date.now() / 1000) + 2592000,
    plan: {
      nickname: 'Elite Sleep+ Monthly'
    }
  },
  timestamp: new Date().toISOString(),
  source: 'production_test'
};

console.log('🚀 Testeando Google Apps Script webhook en producción...');
console.log('URL:', GOOGLE_WEBHOOK_URL);
console.log('Datos de prueba:', JSON.stringify(testData, null, 2));

const postData = JSON.stringify(testData);

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

function makeRequest(url, data, followRedirects = true) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      console.log('\n📊 Respuesta del servidor:');
      console.log('Status:', res.statusCode);
      console.log('Headers:', res.headers);
      
      // Manejar redirecciones
      if ((res.statusCode === 301 || res.statusCode === 302) && followRedirects && res.headers.location) {
        console.log('🔄 Siguiendo redirección a:', res.headers.location);
        return makeRequest(res.headers.location, data, false)
          .then(resolve)
          .catch(reject);
      }
      
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('\n📝 Contenido de la respuesta:');
        try {
          const parsedData = JSON.parse(responseData);
          console.log(JSON.stringify(parsedData, null, 2));
          resolve({ statusCode: res.statusCode, data: parsedData });
        } catch (e) {
          console.log(responseData);
          resolve({ statusCode: res.statusCode, data: responseData });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('\n❌ Error en la petición:', error.message);
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

makeRequest(GOOGLE_WEBHOOK_URL, postData)
  .then(result => {
    if (result.statusCode === 200) {
      console.log('\n✅ Test del Google Apps Script webhook en producción exitoso!');
      if (result.data && result.data.message) {
        console.log('📧 Mensaje:', result.data.message);
      }
    } else {
      console.log('\n❌ Test del Google Apps Script webhook en producción falló');
      console.log('Status Code:', result.statusCode);
    }
  })
  .catch(error => {
    console.error('\n❌ Error durante el test:', error.message);
  });