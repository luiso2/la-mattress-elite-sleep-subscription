#!/usr/bin/env node

/**
 * Manage Customer Metadata
 * Usage: node manage-metadata.js <email> <action> [key] [value]
 * Actions: get, set, remove, clear
 * Example: node manage-metadata.js john@example.com set credits_available 150
 */

require('dotenv').config({ path: '../.env.local' });
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-10-28.acacia',
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

async function findCustomer(email) {
  const customers = await stripe.customers.list({
    email: email,
    limit: 1,
  });

  if (customers.data.length === 0) {
    throw new Error(`No customer found with email: ${email}`);
  }

  return customers.data[0];
}

async function getMetadata(customer) {
  console.log(`\n${colors.cyan}📋 Current Metadata for ${customer.email}:${colors.reset}\n`);
  
  if (!customer.metadata || Object.keys(customer.metadata).length === 0) {
    console.log(`${colors.yellow}No metadata found${colors.reset}`);
    return;
  }

  console.log(`${colors.bright}Key${' '.repeat(30)}Value${colors.reset}`);
  console.log('─'.repeat(60));
  
  Object.entries(customer.metadata).forEach(([key, value]) => {
    const displayKey = key.padEnd(33);
    console.log(`${colors.blue}${displayKey}${colors.reset}${value}`);
  });

  // Special metadata interpretation
  console.log(`\n${colors.cyan}📊 Interpreted Values:${colors.reset}\n`);
  
  // Credits
  if (customer.metadata.credits_available) {
    console.log(`${colors.green}💰 Available Credits: $${customer.metadata.credits_available}${colors.reset}`);
  }
  if (customer.metadata.credits_used) {
    console.log(`${colors.yellow}💸 Used Credits: $${customer.metadata.credits_used}${colors.reset}`);
  }
  if (customer.metadata.credits_reserved) {
    console.log(`${colors.blue}🔒 Reserved Credits: $${customer.metadata.credits_reserved}${colors.reset}`);
  }

  // Protector replacements
  let protectorsUsed = 0;
  for (let i = 1; i <= 3; i++) {
    if (customer.metadata[`protector_${i}_used`] === 'true') {
      protectorsUsed++;
      const date = customer.metadata[`protector_${i}_date`];
      const status = customer.metadata[`protector_${i}_status`];
      console.log(`${colors.blue}🛡️ Protector #${i}: Used${date ? ` on ${new Date(date).toLocaleDateString()}` : ''} - Status: ${status || 'completed'}${colors.reset}`);
    }
  }
  if (protectorsUsed === 0) {
    console.log(`${colors.green}🛡️ All 3 protector replacements available${colors.reset}`);
  } else {
    console.log(`${colors.yellow}🛡️ Protectors used: ${protectorsUsed}/3${colors.reset}`);
  }
}

async function setMetadata(customer, key, value) {
  console.log(`\n${colors.cyan}Setting metadata...${colors.reset}`);
  
  const updatedCustomer = await stripe.customers.update(customer.id, {
    metadata: {
      ...customer.metadata,
      [key]: value
    }
  });

  console.log(`${colors.green}✅ Successfully set ${key} = ${value}${colors.reset}`);
  return updatedCustomer;
}

async function removeMetadata(customer, key) {
  console.log(`\n${colors.cyan}Removing metadata key: ${key}...${colors.reset}`);
  
  const newMetadata = { ...customer.metadata };
  delete newMetadata[key];

  const updatedCustomer = await stripe.customers.update(customer.id, {
    metadata: newMetadata
  });

  console.log(`${colors.green}✅ Successfully removed ${key}${colors.reset}`);
  return updatedCustomer;
}

async function clearMetadata(customer) {
  console.log(`\n${colors.yellow}⚠️  This will clear ALL metadata for ${customer.email}${colors.reset}`);
  console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const updatedCustomer = await stripe.customers.update(customer.id, {
    metadata: {}
  });

  console.log(`${colors.green}✅ Successfully cleared all metadata${colors.reset}`);
  return updatedCustomer;
}

// Preset metadata templates
const templates = {
  'elite-sleep-active': {
    subscription_status: 'active',
    subscription_plan: 'Elite Sleep+',
    credits_available: '180',
    credits_used: '0',
    credits_monthly: '15',
    protector_1_used: 'false',
    protector_2_used: 'false',
    protector_3_used: 'false',
    member_since: new Date().toISOString()
  },
  'elite-sleep-canceled': {
    subscription_status: 'canceled',
    subscription_plan: 'Elite Sleep+',
    credits_available: '0',
    credits_used: '0',
    credits_monthly: '0',
    canceled_date: new Date().toISOString()
  },
  'reset-protectors': {
    protector_1_used: 'false',
    protector_1_date: '',
    protector_1_status: '',
    protector_2_used: 'false',
    protector_2_date: '',
    protector_2_status: '',
    protector_3_used: 'false',
    protector_3_date: '',
    protector_3_status: ''
  },
  'reset-credits': {
    credits_available: '0',
    credits_used: '0',
    credits_reserved: '0',
    credits_monthly: '15'
  }
};

async function applyTemplate(customer, templateName) {
  const template = templates[templateName];
  
  if (!template) {
    console.log(`${colors.red}❌ Template not found: ${templateName}${colors.reset}`);
    console.log(`Available templates: ${Object.keys(templates).join(', ')}`);
    return;
  }

  console.log(`\n${colors.cyan}Applying template: ${templateName}...${colors.reset}`);
  
  const updatedCustomer = await stripe.customers.update(customer.id, {
    metadata: {
      ...customer.metadata,
      ...template
    }
  });

  console.log(`${colors.green}✅ Successfully applied template${colors.reset}`);
  return updatedCustomer;
}

// Main execution
async function main() {
  const email = process.argv[2];
  const action = process.argv[3];
  const key = process.argv[4];
  const value = process.argv[5];

  if (!email || !action) {
    console.log(`${colors.yellow}Usage: node manage-metadata.js <email> <action> [key] [value]${colors.reset}`);
    console.log(`\nActions:`);
    console.log(`  get                       - Show all metadata`);
    console.log(`  set <key> <value>        - Set a metadata key`);
    console.log(`  remove <key>             - Remove a metadata key`);
    console.log(`  clear                    - Clear all metadata`);
    console.log(`  template <name>          - Apply a preset template`);
    console.log(`\nExamples:`);
    console.log(`  node manage-metadata.js john@example.com get`);
    console.log(`  node manage-metadata.js john@example.com set credits_available 150`);
    console.log(`  node manage-metadata.js john@example.com remove old_key`);
    console.log(`  node manage-metadata.js john@example.com template elite-sleep-active`);
    console.log(`\nAvailable templates: ${Object.keys(templates).join(', ')}`);
    process.exit(1);
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error(`${colors.red}❌ Error: STRIPE_SECRET_KEY not found${colors.reset}`);
    process.exit(1);
  }

  try {
    const customer = await findCustomer(email);
    console.log(`${colors.green}✓ Found customer: ${customer.id}${colors.reset}`);

    let updatedCustomer = customer;

    switch (action.toLowerCase()) {
      case 'get':
        await getMetadata(customer);
        break;
      
      case 'set':
        if (!key || value === undefined) {
          console.log(`${colors.red}❌ Error: 'set' requires key and value${colors.reset}`);
          process.exit(1);
        }
        updatedCustomer = await setMetadata(customer, key, value);
        await getMetadata(updatedCustomer);
        break;
      
      case 'remove':
        if (!key) {
          console.log(`${colors.red}❌ Error: 'remove' requires key${colors.reset}`);
          process.exit(1);
        }
        updatedCustomer = await removeMetadata(customer, key);
        await getMetadata(updatedCustomer);
        break;
      
      case 'clear':
        updatedCustomer = await clearMetadata(customer);
        await getMetadata(updatedCustomer);
        break;
      
      case 'template':
        if (!key) {
          console.log(`${colors.red}❌ Error: 'template' requires template name${colors.reset}`);
          console.log(`Available templates: ${Object.keys(templates).join(', ')}`);
          process.exit(1);
        }
        updatedCustomer = await applyTemplate(customer, key);
        await getMetadata(updatedCustomer);
        break;
      
      default:
        console.log(`${colors.red}❌ Unknown action: ${action}${colors.reset}`);
        process.exit(1);
    }

  } catch (error) {
    console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);