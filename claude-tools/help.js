#!/usr/bin/env node

/**
 * Interactive Help for Claude Stripe Tools
 * Usage: node help.js
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const tools = [
  {
    name: 'find-customer.js',
    description: 'Search for customers by email',
    usage: 'node find-customer.js <email>',
    examples: [
      'node find-customer.js john@example.com',
      'node find-customer.js arman@lamattress.com'
    ],
    features: [
      'Customer details and metadata',
      'Active subscriptions',
      'Payment methods',
      'Invoice history',
      'Total lifetime value'
    ]
  },
  {
    name: 'test-webhook.js',
    description: 'Send test webhook events',
    usage: 'node test-webhook.js <event-type> [email] [url]',
    examples: [
      'node test-webhook.js --list',
      'node test-webhook.js payment_intent.succeeded',
      'node test-webhook.js customer.subscription.created john@example.com'
    ],
    features: [
      'Test webhook endpoints',
      'Simulate Stripe events',
      'Use real customer data',
      'Custom webhook URLs'
    ]
  },
  {
    name: 'list-subscriptions.js',
    description: 'View all subscriptions with analytics',
    usage: 'node list-subscriptions.js [status]',
    examples: [
      'node list-subscriptions.js',
      'node list-subscriptions.js active',
      'node list-subscriptions.js canceled'
    ],
    features: [
      'MRR and ARR calculation',
      'Status breakdown',
      'Churn metrics',
      'Customer details',
      'Next billing dates'
    ]
  },
  {
    name: 'manage-metadata.js',
    description: 'Manage customer metadata',
    usage: 'node manage-metadata.js <email> <action> [key] [value]',
    examples: [
      'node manage-metadata.js john@example.com get',
      'node manage-metadata.js john@example.com set credits_available 150',
      'node manage-metadata.js john@example.com template elite-sleep-active'
    ],
    features: [
      'View/edit metadata',
      'Apply templates',
      'Reset credits',
      'Reset protectors',
      'Bulk updates'
    ]
  },
  {
    name: 'check-config.js',
    description: 'Verify Stripe configuration',
    usage: 'node check-config.js',
    examples: [
      'node check-config.js'
    ],
    features: [
      'Environment variables check',
      'API connection test',
      'Products verification',
      'Webhook validation',
      'Project structure check'
    ]
  }
];

function displayHeader() {
  console.log(`
${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}
${colors.bright}${colors.cyan}   🛠️  CLAUDE STRIPE TOOLS - INTERACTIVE HELP${colors.reset}
${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}
`);
}

function displayQuickStart() {
  console.log(`${colors.bright}${colors.green}🚀 QUICK START${colors.reset}\n`);
  console.log(`  1. ${colors.blue}Install dependencies:${colors.reset} npm install`);
  console.log(`  2. ${colors.blue}Check configuration:${colors.reset} node check-config.js`);
  console.log(`  3. ${colors.blue}Find a customer:${colors.reset} node find-customer.js email@example.com`);
  console.log(`  4. ${colors.blue}List subscriptions:${colors.reset} node list-subscriptions.js\n`);
}

function displayToolDetails() {
  console.log(`${colors.bright}${colors.yellow}📦 AVAILABLE TOOLS${colors.reset}\n`);
  
  tools.forEach((tool, index) => {
    console.log(`${colors.bright}${index + 1}. ${tool.name}${colors.reset}`);
    console.log(`   ${colors.dim}${tool.description}${colors.reset}`);
    console.log(`   ${colors.blue}Usage:${colors.reset} ${tool.usage}`);
    console.log(`   ${colors.green}Examples:${colors.reset}`);
    tool.examples.forEach(ex => {
      console.log(`     • ${ex}`);
    });
    console.log('');
  });
}

function displayCommonWorkflows() {
  console.log(`${colors.bright}${colors.magenta}🔄 COMMON WORKFLOWS${colors.reset}\n`);
  
  const workflows = [
    {
      title: 'Set up new Elite Sleep+ member',
      steps: [
        'node find-customer.js customer@email.com',
        'node manage-metadata.js customer@email.com template elite-sleep-active',
        'node test-webhook.js customer.subscription.created customer@email.com'
      ]
    },
    {
      title: 'Debug subscription issue',
      steps: [
        'node find-customer.js customer@email.com',
        'node manage-metadata.js customer@email.com get',
        'node list-subscriptions.js active'
      ]
    },
    {
      title: 'Reset customer benefits',
      steps: [
        'node manage-metadata.js customer@email.com template reset-credits',
        'node manage-metadata.js customer@email.com template reset-protectors'
      ]
    },
    {
      title: 'Test webhook integration',
      steps: [
        'node test-webhook.js --list',
        'node test-webhook.js payment_intent.succeeded',
        'node test-webhook.js customer.subscription.created customer@email.com'
      ]
    }
  ];

  workflows.forEach(workflow => {
    console.log(`  ${colors.cyan}${workflow.title}:${colors.reset}`);
    workflow.steps.forEach((step, i) => {
      console.log(`    ${i + 1}. ${step}`);
    });
    console.log('');
  });
}

function displayTips() {
  console.log(`${colors.bright}${colors.blue}💡 PRO TIPS${colors.reset}\n`);
  
  const tips = [
    'Use test mode keys (sk_test_) for development',
    'Always verify customer exists before updating metadata',
    'Check webhook signatures match between Stripe and your app',
    'Monitor MRR/ARR regularly with list-subscriptions',
    'Use templates for consistent metadata setup',
    'Test webhooks locally before deploying to production'
  ];

  tips.forEach(tip => {
    console.log(`  ${colors.yellow}•${colors.reset} ${tip}`);
  });
  console.log('');
}

function displayTroubleshooting() {
  console.log(`${colors.bright}${colors.red}🔧 TROUBLESHOOTING${colors.reset}\n`);
  
  const issues = [
    {
      problem: 'STRIPE_SECRET_KEY not found',
      solution: 'Check .env.local exists in parent directory with correct keys'
    },
    {
      problem: 'Customer not found',
      solution: 'Verify email and check if using test vs live mode'
    },
    {
      problem: 'Webhook test fails',
      solution: 'Ensure local server is running on correct port'
    },
    {
      problem: 'Connection refused',
      solution: 'Check internet connection and API key validity'
    }
  ];

  issues.forEach(issue => {
    console.log(`  ${colors.red}Problem:${colors.reset} ${issue.problem}`);
    console.log(`  ${colors.green}Solution:${colors.reset} ${issue.solution}\n`);
  });
}

function displayCustomerEmails() {
  console.log(`${colors.bright}${colors.cyan}👥 LA MATTRESS EMPLOYEE EMAILS${colors.reset}\n`);
  
  const employees = [
    'arman@lamattress.com',
    'ayron@lamattress.com',
    'geoffrey@lamattress.com',
    'henry@lamattress.com',
    'elyse@lamattress.com',
    'carlos@lamattress.com',
    'julio@lamattress.com',
    'rony@lamattress.com',
    'wayne@lamattress.com',
    'tim@lamattress.com',
    'brandon@lamattress.com',
    'ronnie@lamattress.com'
  ];

  console.log('  Test with these employee emails:');
  employees.forEach(email => {
    console.log(`    • ${email}`);
  });
  console.log('');
}

function displayFooter() {
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.dim}Built for LA Mattress Elite Sleep+ Subscription Portal${colors.reset}`);
  console.log(`${colors.dim}For more help, check README.md or run: node <tool>.js --help${colors.reset}\n`);
}

// Main execution
function main() {
  displayHeader();
  displayQuickStart();
  displayToolDetails();
  displayCommonWorkflows();
  displayCustomerEmails();
  displayTips();
  displayTroubleshooting();
  displayFooter();
}

// Run
main();