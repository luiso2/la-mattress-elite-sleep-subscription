#!/usr/bin/env node

/**
 * Quick Setup Script for Claude Stripe Tools
 * Usage: node setup.js
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function checkNodeVersion() {
  console.log(`${colors.cyan}Checking Node.js version...${colors.reset}`);
  const version = process.version;
  const major = parseInt(version.split('.')[0].substring(1));
  
  if (major < 14) {
    console.log(`${colors.red}❌ Node.js version ${version} is too old. Please upgrade to v14 or higher.${colors.reset}`);
    return false;
  }
  
  console.log(`${colors.green}✓ Node.js ${version} detected${colors.reset}`);
  return true;
}

async function checkEnvFile() {
  console.log(`\n${colors.cyan}Checking environment configuration...${colors.reset}`);
  const envPath = path.join(__dirname, '../.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log(`${colors.yellow}⚠️  .env.local not found${colors.reset}`);
    
    const create = await question('Would you like to create it now? (y/n): ');
    if (create.toLowerCase() === 'y') {
      await createEnvFile();
    }
    return false;
  }
  
  console.log(`${colors.green}✓ .env.local found${colors.reset}`);
  
  // Check for required keys
  const content = fs.readFileSync(envPath, 'utf8');
  const required = ['STRIPE_SECRET_KEY', 'JWT_SECRET'];
  const missing = [];
  
  required.forEach(key => {
    if (!content.includes(key)) {
      missing.push(key);
    }
  });
  
  if (missing.length > 0) {
    console.log(`${colors.yellow}⚠️  Missing keys: ${missing.join(', ')}${colors.reset}`);
    return false;
  }
  
  // Check for test vs live keys
  if (content.includes('sk_test_')) {
    console.log(`${colors.yellow}⚠️  Using TEST mode Stripe keys${colors.reset}`);
  } else if (content.includes('sk_live_')) {
    console.log(`${colors.green}✓ Using LIVE mode Stripe keys${colors.reset}`);
  }
  
  return true;
}

async function createEnvFile() {
  console.log(`\n${colors.cyan}Creating .env.local file...${colors.reset}`);
  
  const template = `# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE

# Price IDs
STRIPE_PRICE_ID_BASIC=price_basic_monthly_id
STRIPE_PRICE_ID_PREMIUM=price_premium_monthly_id
STRIPE_PRICE_ID_ENTERPRISE=price_enterprise_monthly_id

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
`;

  const envPath = path.join(__dirname, '../.env.local');
  fs.writeFileSync(envPath, template);
  
  console.log(`${colors.green}✓ Created .env.local template${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Please edit .env.local and add your Stripe keys${colors.reset}`);
}

async function installDependencies() {
  console.log(`\n${colors.cyan}Installing dependencies...${colors.reset}`);
  
  return new Promise((resolve, reject) => {
    exec('npm install', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.log(`${colors.red}❌ Failed to install dependencies${colors.reset}`);
        console.error(stderr);
        reject(error);
      } else {
        console.log(`${colors.green}✓ Dependencies installed successfully${colors.reset}`);
        resolve();
      }
    });
  });
}

async function runTests() {
  console.log(`\n${colors.cyan}Running configuration check...${colors.reset}`);
  
  return new Promise((resolve) => {
    exec('node check-config.js', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.log(`${colors.yellow}⚠️  Configuration check failed - please fix issues${colors.reset}`);
        console.log(stdout);
      } else {
        console.log(stdout);
      }
      resolve();
    });
  });
}

async function displayNextSteps() {
  console.log(`\n${colors.bright}${colors.green}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.green}✅ SETUP COMPLETE!${colors.reset}`);
  console.log(`${colors.bright}${colors.green}═══════════════════════════════════════${colors.reset}\n`);
  
  console.log(`${colors.cyan}Next steps:${colors.reset}`);
  console.log(`  1. ${colors.blue}Edit .env.local${colors.reset} and add your Stripe keys`);
  console.log(`  2. ${colors.blue}Run${colors.reset} node check-config.js ${colors.blue}to verify setup${colors.reset}`);
  console.log(`  3. ${colors.blue}Run${colors.reset} node help.js ${colors.blue}for usage instructions${colors.reset}\n`);
  
  console.log(`${colors.cyan}Quick commands:${colors.reset}`);
  console.log(`  • Find customer:     node find-customer.js email@example.com`);
  console.log(`  • List subscriptions: node list-subscriptions.js`);
  console.log(`  • Test webhook:      node test-webhook.js --list`);
  console.log(`  • Check config:      node check-config.js`);
  console.log(`  • Get help:          node help.js\n`);
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}   🚀 CLAUDE STRIPE TOOLS SETUP${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);
  
  try {
    // Check Node version
    const nodeOk = await checkNodeVersion();
    if (!nodeOk) {
      process.exit(1);
    }
    
    // Check/create env file
    await checkEnvFile();
    
    // Install dependencies
    const install = await question('\nInstall/update npm dependencies? (y/n): ');
    if (install.toLowerCase() === 'y') {
      await installDependencies();
    }
    
    // Run config check
    const check = await question('\nRun configuration check? (y/n): ');
    if (check.toLowerCase() === 'y') {
      await runTests();
    }
    
    // Display next steps
    await displayNextSteps();
    
  } catch (error) {
    console.error(`${colors.red}Setup failed: ${error.message}${colors.reset}`);
  } finally {
    rl.close();
  }
}

// Run setup
main().catch(console.error);