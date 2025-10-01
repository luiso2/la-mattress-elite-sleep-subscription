const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-10-28.acacia',
});

async function resetProtectors() {
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
    
    // Get current metadata
    const currentMetadata = customer.metadata || {};
    console.log('\n=== CURRENT PROTECTOR STATUS ===');
    for (let i = 1; i <= 3; i++) {
      if (currentMetadata[`protector_${i}_used`] === 'true') {
        console.log(`Protector #${i}: USED`);
      } else {
        console.log(`Protector #${i}: Available`);
      }
    }
    
    // Create new metadata with protectors reset
    const updatedMetadata = { ...currentMetadata };
    
    // Remove all protector-related metadata
    for (let i = 1; i <= 3; i++) {
      delete updatedMetadata[`protector_${i}_used`];
      delete updatedMetadata[`protector_${i}_date`];
      delete updatedMetadata[`protector_${i}_status`];
    }
    
    // Update customer in Stripe
    console.log('\n=== RESETTING PROTECTORS ===');
    await stripe.customers.update(customer.id, {
      metadata: updatedMetadata
    });
    
    console.log('✅ Protectors have been reset successfully!');
    
    // Verify the update
    const updatedCustomer = await stripe.customers.retrieve(customer.id);
    console.log('\n=== NEW PROTECTOR STATUS ===');
    for (let i = 1; i <= 3; i++) {
      if (updatedCustomer.metadata[`protector_${i}_used`] === 'true') {
        console.log(`Protector #${i}: USED`);
      } else {
        console.log(`Protector #${i}: Available`);
      }
    }
    
    console.log('\n✅ All protectors are now available for use!');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

resetProtectors();