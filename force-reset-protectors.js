const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-10-28.acacia',
});

async function forceResetProtectors() {
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
    
    // Display current metadata
    console.log('\n=== CURRENT METADATA ===');
    console.log(JSON.stringify(customer.metadata, null, 2));
    
    // Build new metadata, keeping only non-protector fields
    const newMetadata = {};
    for (const [key, value] of Object.entries(customer.metadata)) {
      // Skip any protector-related keys
      if (!key.includes('protector_')) {
        newMetadata[key] = value;
      }
    }
    
    // Explicitly set protectors as not used (optional - can leave empty)
    // newMetadata.protector_1_used = 'false';
    // newMetadata.protector_2_used = 'false';
    // newMetadata.protector_3_used = 'false';
    
    console.log('\n=== NEW METADATA (protectors removed) ===');
    console.log(JSON.stringify(newMetadata, null, 2));
    
    // Update customer with completely new metadata
    console.log('\n=== UPDATING CUSTOMER ===');
    const updatedCustomer = await stripe.customers.update(customer.id, {
      metadata: newMetadata
    });
    
    console.log('\n✅ Customer updated successfully!');
    
    // Verify the update
    console.log('\n=== VERIFICATION - FINAL METADATA ===');
    console.log(JSON.stringify(updatedCustomer.metadata, null, 2));
    
    console.log('\n=== PROTECTOR STATUS ===');
    for (let i = 1; i <= 3; i++) {
      const isUsed = updatedCustomer.metadata[`protector_${i}_used`] === 'true';
      console.log(`Protector #${i}: ${isUsed ? 'USED' : '✅ Available'}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

forceResetProtectors();