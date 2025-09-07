const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-10-28.acacia',
});

async function clearProtectors() {
  try {
    const email = 'cecilia.garciaprofessional@gmail.com';
    console.log(`\nSearching for customer: ${email}\n`);
    
    // Search for customer by email
    const customers = await stripe.customers.search({
      query: `email:"${email}"`,
    });
    
    if (customers.data.length === 0) {
      console.log('Customer not found');
      return;
    }
    
    const customer = customers.data[0];
    console.log(`Found customer: ${customer.id} - ${customer.name}`);
    
    console.log('\n=== CLEARING PROTECTOR METADATA ===');
    
    // Update with explicit empty strings to clear the metadata
    const result = await stripe.customers.update(customer.id, {
      metadata: {
        'protector_1_used': '',
        'protector_1_date': '',
        'protector_1_status': '',
        'protector_2_used': '',
        'protector_2_date': '',
        'protector_2_status': '',
        'protector_3_used': '',
        'protector_3_date': '',
        'protector_3_status': ''
      }
    });
    
    console.log('\n✅ Metadata cleared!');
    
    // Verify the result
    console.log('\n=== FINAL METADATA ===');
    console.log(JSON.stringify(result.metadata, null, 2));
    
    console.log('\n=== PROTECTOR STATUS ===');
    for (let i = 1; i <= 3; i++) {
      const isUsed = result.metadata[`protector_${i}_used`] === 'true';
      console.log(`Protector #${i}: ${isUsed ? 'USED' : '✅ Available'}`);
    }
    
    console.log('\n✅ All protectors have been reset and are now available!');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

clearProtectors();