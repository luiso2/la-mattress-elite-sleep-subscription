const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-10-28.acacia',
});

async function checkCustomerMetadata() {
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
    console.log('=================================');
    console.log('CUSTOMER INFORMATION');
    console.log('=================================');
    console.log(`ID: ${customer.id}`);
    console.log(`Name: ${customer.name || 'Not set'}`);
    console.log(`Email: ${customer.email}`);
    console.log(`Created: ${new Date(customer.created * 1000).toLocaleString()}`);
    
    console.log('\n=================================');
    console.log('METADATA');
    console.log('=================================');
    
    if (Object.keys(customer.metadata).length === 0) {
      console.log('No metadata found');
    } else {
      // Display metadata in a formatted way
      for (const [key, value] of Object.entries(customer.metadata)) {
        console.log(`${key}: ${value}`);
      }
    }
    
    // Check for credits
    console.log('\n=================================');
    console.log('CREDITS INFORMATION');
    console.log('=================================');
    const creditsUsed = parseInt(customer.metadata.credits_used || '0');
    const creditsReserved = parseInt(customer.metadata.credits_reserved || '0');
    console.log(`Credits Used: $${creditsUsed}`);
    console.log(`Credits Reserved: $${creditsReserved}`);
    
    // Check for protector replacements
    console.log('\n=================================');
    console.log('PROTECTOR REPLACEMENTS');
    console.log('=================================');
    for (let i = 1; i <= 3; i++) {
      const isUsed = customer.metadata[`protector_${i}_used`] === 'true';
      const date = customer.metadata[`protector_${i}_date`];
      
      if (isUsed) {
        console.log(`Protector #${i}: USED${date ? ` on ${new Date(date).toLocaleDateString()}` : ''}`);
      } else {
        console.log(`Protector #${i}: Available`);
      }
    }
    
    // Get subscription info
    console.log('\n=================================');
    console.log('SUBSCRIPTION STATUS');
    console.log('=================================');
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 1,
    });
    
    if (subscriptions.data.length > 0) {
      const sub = subscriptions.data[0];
      console.log(`Status: ${sub.status}`);
      console.log(`Current Period End: ${new Date(sub.current_period_end * 1000).toLocaleDateString()}`);
      console.log(`Cancel at Period End: ${sub.cancel_at_period_end}`);
    } else {
      console.log('No subscription found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkCustomerMetadata();