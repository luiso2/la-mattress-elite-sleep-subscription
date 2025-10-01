const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function resetCashbackMetadata() {
  try {
    console.log('Searching for customer with email: cecilia.garciaprofessional@gmail.com');
    
    // Search for the customer by email
    const customers = await stripe.customers.list({
      email: 'cecilia.garciaprofessional@gmail.com',
      limit: 1
    });

    if (customers.data.length === 0) {
      console.log('Customer not found');
      return;
    }

    const customer = customers.data[0];
    console.log(`Found customer: ${customer.id} - ${customer.name}`);
    console.log('Current metadata:', customer.metadata);

    // Reset cashback-related metadata
    const updatedCustomer = await stripe.customers.update(customer.id, {
      metadata: {
        ...customer.metadata,
        // Reset cashback fields
        cashback_balance: '0',
        cashback_history: '[]',
        last_cashback_update: null,
        last_cashback_employee: null,
        last_cashback_employee_email: null
      }
    });

    console.log('\n✅ Metadata reset successfully!');
    console.log('New cashback metadata:');
    console.log('- cashback_balance:', updatedCustomer.metadata.cashback_balance);
    console.log('- cashback_history:', updatedCustomer.metadata.cashback_history);
    console.log('- last_cashback_update:', updatedCustomer.metadata.last_cashback_update || 'null');
    console.log('- last_cashback_employee:', updatedCustomer.metadata.last_cashback_employee || 'null');

  } catch (error) {
    console.error('Error resetting metadata:', error.message);
  }
}

// Run the reset
resetCashbackMetadata();