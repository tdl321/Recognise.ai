#!/usr/bin/env node

/**
 * Waste Detection Web App Demo Setup
 * 
 * This script helps you set up and run the waste detection web app.
 * It will guide you through:
 * 1. Setting up Supabase
 * 2. Starting the FastAPI backend
 * 3. Running the Next.js frontend
 */

const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Print header
console.log(`
${colors.green}${colors.bright}======================================================${colors.reset}
${colors.green}${colors.bright}      WASTE DETECTION WEB APP - SETUP GUIDE          ${colors.reset}
${colors.green}${colors.bright}======================================================${colors.reset}

This script will help you set up and run the waste detection web app.
You'll need to follow a few steps to get everything working correctly.

`);

// Check if .env.local exists
const envExists = fs.existsSync('.env.local');
if (!envExists) {
  console.log(`${colors.yellow}No .env.local file found. Creating one from .env.example...${colors.reset}`);
  try {
    fs.copyFileSync('.env.example', '.env.local');
    console.log(`${colors.green}Created .env.local file. You'll need to update it with your Supabase credentials.${colors.reset}`);
  } catch (err) {
    console.error(`${colors.red}Error creating .env.local: ${err.message}${colors.reset}`);
  }
}

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

const setupSteps = async () => {
  console.log(`
${colors.cyan}${colors.bright}STEP 1: Supabase Setup${colors.reset}
${colors.cyan}------------------${colors.reset}
To use the waste detection app with real-time data, you need a Supabase account.

1. Go to ${colors.bright}https://supabase.com${colors.reset} and sign up/log in
2. Create a new project
3. Once your project is ready, navigate to Project Settings → API
4. Copy your project URL and anon/public key
5. Update these values in your .env.local file

Would you like to update your .env.local file now? (y/n): `);

  const updateEnv = await askQuestion('');
  
  if (updateEnv.toLowerCase() === 'y') {
    const supabaseUrl = await askQuestion(`Enter your Supabase URL (https://your-project.supabase.co): `);
    const supabaseKey = await askQuestion(`Enter your Supabase anon key: `);
    
    try {
      let envContent = fs.readFileSync('.env.local', 'utf8');
      envContent = envContent.replace(/NEXT_PUBLIC_SUPABASE_URL=.*/, `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`);
      envContent = envContent.replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/, `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey}`);
      fs.writeFileSync('.env.local', envContent);
      console.log(`${colors.green}Successfully updated .env.local with your Supabase credentials!${colors.reset}`);
    } catch (err) {
      console.error(`${colors.red}Error updating .env.local: ${err.message}${colors.reset}`);
    }
  }

  console.log(`
${colors.cyan}${colors.bright}STEP 2: Database Setup${colors.reset}
${colors.cyan}------------------${colors.reset}
You need to create the necessary table in your Supabase project.

1. Go to ${colors.bright}https://app.supabase.com/project/[YOUR-PROJECT-ID]/sql${colors.reset}
2. Run the following SQL query:

${colors.bright}CREATE TABLE IF NOT EXISTS detections (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  waste_type TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  inference_speed FLOAT NOT NULL
);${colors.reset}

3. In your Supabase dashboard, enable realtime capabilities:
   - Go to Database → Replication
   - Under "Realtime", enable the detections table for INSERT operations

${colors.yellow}Have you created the table and enabled realtime? (y/n): ${colors.reset}`);

  const tableCreated = await askQuestion('');
  
  if (tableCreated.toLowerCase() !== 'y') {
    console.log(`${colors.yellow}Please create the table before continuing with the setup.${colors.reset}`);
  }

  console.log(`
${colors.cyan}${colors.bright}STEP 3: FastAPI Backend${colors.reset}
${colors.cyan}-------------------${colors.reset}
The app requires a FastAPI backend running for waste detection.

1. Make sure you have Python installed (3.8+ recommended)
2. Install required packages:
   ${colors.bright}pip install -r requirements.txt${colors.reset}
3. Start the FastAPI server:
   ${colors.bright}cd detection_api && uvicorn main:app --reload${colors.reset}

${colors.yellow}Start the FastAPI backend in a new terminal window.${colors.reset}
Press any key once the backend is running...`);

  await askQuestion('');

  console.log(`
${colors.cyan}${colors.bright}STEP 4: Generate Mock Data${colors.reset}
${colors.cyan}----------------------${colors.reset}
You can seed your database with mock detection data for testing.

1. Start the Next.js development server:
   ${colors.bright}npm run dev${colors.reset}
2. Navigate to http://localhost:3000/settings
3. In the Database Management section, use the "Seed Database" button

${colors.yellow}Start the Next.js app now? (y/n): ${colors.reset}`);

  const startApp = await askQuestion('');
  
  if (startApp.toLowerCase() === 'y') {
    console.log(`${colors.green}Starting Next.js development server...${colors.reset}`);
    try {
      execSync('npm run dev', { stdio: 'inherit' });
    } catch (err) {
      console.error(`${colors.red}Error starting Next.js app: ${err.message}${colors.reset}`);
    }
  } else {
    console.log(`
${colors.green}${colors.bright}SETUP COMPLETE!${colors.reset}
${colors.green}--------------${colors.reset}
You can now:

1. Start the FastAPI backend:
   ${colors.bright}cd detection_api && uvicorn main:app --reload${colors.reset}
2. Start the Next.js frontend:
   ${colors.bright}npm run dev${colors.reset}
3. Open http://localhost:3000 in your browser
4. Use the Settings page to seed your database with mock data
5. Explore the Detection and Analytics pages

${colors.yellow}Thank you for using Waste Detection Web App!${colors.reset}
`);
  }

  rl.close();
};

setupSteps().catch(err => {
  console.error(`${colors.red}Error during setup: ${err.message}${colors.reset}`);
  rl.close();
}); 