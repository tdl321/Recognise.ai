#!/usr/bin/env node

/**
 * Seed historical data into Supabase
 * 
 * This script will load the historical data from lib/mockData.ts
 * and insert it into the Supabase database.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Historical data from the mockData.ts file
const historicalData = [
  // 2014 Data (929.16 tons total with 24.9% single stream, 21.5% recovered, 53.6% routine trash)
  { year: 2014, month: 1, totalSingleStream: 19.3, totalRecovered: 16.7, totalRoutineTrash: 41.5, total: 77.5 },
  { year: 2014, month: 2, totalSingleStream: 19.3, totalRecovered: 16.7, totalRoutineTrash: 41.5, total: 77.5 },
  { year: 2014, month: 3, totalSingleStream: 19.3, totalRecovered: 16.7, totalRoutineTrash: 41.5, total: 77.5 },
  { year: 2014, month: 4, totalSingleStream: 19.3, totalRecovered: 16.7, totalRoutineTrash: 41.5, total: 77.5 },
  { year: 2014, month: 5, totalSingleStream: 19.3, totalRecovered: 16.7, totalRoutineTrash: 41.5, total: 77.5 },
  { year: 2014, month: 6, totalSingleStream: 19.3, totalRecovered: 16.7, totalRoutineTrash: 41.5, total: 77.5 },
  { year: 2014, month: 7, totalSingleStream: 19.3, totalRecovered: 16.7, totalRoutineTrash: 41.5, total: 77.5 },
  { year: 2014, month: 8, totalSingleStream: 19.3, totalRecovered: 16.7, totalRoutineTrash: 41.5, total: 77.5 },
  { year: 2014, month: 9, totalSingleStream: 19.3, totalRecovered: 16.7, totalRoutineTrash: 41.5, total: 77.5 },
  { year: 2014, month: 10, totalSingleStream: 19.3, totalRecovered: 16.7, totalRoutineTrash: 41.5, total: 77.5 },
  { year: 2014, month: 11, totalSingleStream: 19.3, totalRecovered: 16.7, totalRoutineTrash: 41.5, total: 77.5 },
  { year: 2014, month: 12, totalSingleStream: 19.3, totalRecovered: 16.7, totalRoutineTrash: 41.5, total: 77.5 },
  
  // 2015 Data (786 tons total with 26.3% single stream, 22.0% recovered, 51.8% routine trash)
  { year: 2015, month: 1, totalSingleStream: 17.2, totalRecovered: 14.4, totalRoutineTrash: 33.9, total: 65.5 },
  { year: 2015, month: 2, totalSingleStream: 17.2, totalRecovered: 14.4, totalRoutineTrash: 33.9, total: 65.5 },
  { year: 2015, month: 3, totalSingleStream: 17.2, totalRecovered: 14.4, totalRoutineTrash: 33.9, total: 65.5 },
  { year: 2015, month: 4, totalSingleStream: 17.2, totalRecovered: 14.4, totalRoutineTrash: 33.9, total: 65.5 },
  { year: 2015, month: 5, totalSingleStream: 17.2, totalRecovered: 14.4, totalRoutineTrash: 33.9, total: 65.5 },
  { year: 2015, month: 6, totalSingleStream: 17.2, totalRecovered: 14.4, totalRoutineTrash: 33.9, total: 65.5 },
  { year: 2015, month: 7, totalSingleStream: 17.2, totalRecovered: 14.4, totalRoutineTrash: 33.9, total: 65.5 },
  { year: 2015, month: 8, totalSingleStream: 17.2, totalRecovered: 14.4, totalRoutineTrash: 33.9, total: 65.5 },
  { year: 2015, month: 9, totalSingleStream: 17.2, totalRecovered: 14.4, totalRoutineTrash: 33.9, total: 65.5 },
  { year: 2015, month: 10, totalSingleStream: 17.2, totalRecovered: 14.4, totalRoutineTrash: 33.9, total: 65.5 },
  { year: 2015, month: 11, totalSingleStream: 17.2, totalRecovered: 14.4, totalRoutineTrash: 33.9, total: 65.5 },
  { year: 2015, month: 12, totalSingleStream: 17.2, totalRecovered: 14.4, totalRoutineTrash: 33.9, total: 65.5 },
];

// Category mapping
const categoryMapping = {
  totalSingleStream: ["paper", "cardboard"],   // Typically paper and cardboard
  totalRecovered: ["glass", "metal"],          // Typically glass and metals
  totalRoutineTrash: ["plastic", "other"]      // Plastics and non-recyclables
};

/**
 * Generate detection records based on historical data
 * @param {Object} data Historical data entry
 * @returns {Array} Array of detection records
 */
function generateDetectionsFromHistoricalData(data) {
  const detections = [];
  const date = new Date(data.year, data.month - 1, 1);
  const daysInMonth = new Date(data.year, data.month, 0).getDate();
  
  // Generate random days within the month
  const daysUsed = new Set();
  while (daysUsed.size < daysInMonth * 0.7) { // Use 70% of days in month
    const day = Math.floor(Math.random() * daysInMonth) + 1;
    daysUsed.add(day);
  }
  
  // Create an array of days
  const days = Array.from(daysUsed).sort((a, b) => a - b);
  
  // Calculate number of detections per category based on proportions
  const totalSingleStreamDetections = Math.round(data.totalSingleStream * 2); // Reduced scale factor
  const totalRecoveredDetections = Math.round(data.totalRecovered * 2);
  const totalRoutineTrashDetections = Math.round(data.totalRoutineTrash * 2);
  
  // Create single stream detections (paper, cardboard)
  for (let i = 0; i < totalSingleStreamDetections; i++) {
    const day = days[Math.floor(Math.random() * days.length)];
    const hour = Math.floor(Math.random() * 12) + 8; // Between 8am and 8pm
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    
    const timestamp = new Date(date);
    timestamp.setDate(day);
    timestamp.setHours(hour, minute, second);
    
    const wasteType = categoryMapping.totalSingleStream[Math.floor(Math.random() * categoryMapping.totalSingleStream.length)];
    const isCorrect = Math.random() < 0.8; // 80% correct disposal for single stream
    
    detections.push({
      timestamp: timestamp.toISOString(),
      waste_type: wasteType,
      is_correct: isCorrect,
      inference_speed: 25 + Math.random() * 15 // Between 25-40 FPS
    });
  }
  
  // Create recovered detections (glass, metal)
  for (let i = 0; i < totalRecoveredDetections; i++) {
    const day = days[Math.floor(Math.random() * days.length)];
    const hour = Math.floor(Math.random() * 12) + 8; // Between 8am and 8pm
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    
    const timestamp = new Date(date);
    timestamp.setDate(day);
    timestamp.setHours(hour, minute, second);
    
    const wasteType = categoryMapping.totalRecovered[Math.floor(Math.random() * categoryMapping.totalRecovered.length)];
    const isCorrect = Math.random() < 0.75; // 75% correct disposal for recovered
    
    detections.push({
      timestamp: timestamp.toISOString(),
      waste_type: wasteType,
      is_correct: isCorrect,
      inference_speed: 25 + Math.random() * 15 // Between 25-40 FPS
    });
  }
  
  // Create routine trash detections (plastic, other)
  for (let i = 0; i < totalRoutineTrashDetections; i++) {
    const day = days[Math.floor(Math.random() * days.length)];
    const hour = Math.floor(Math.random() * 12) + 8; // Between 8am and 8pm
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    
    const timestamp = new Date(date);
    timestamp.setDate(day);
    timestamp.setHours(hour, minute, second);
    
    const wasteType = categoryMapping.totalRoutineTrash[Math.floor(Math.random() * categoryMapping.totalRoutineTrash.length)];
    const isCorrect = Math.random() < 0.6; // 60% correct disposal for routine trash
    
    detections.push({
      timestamp: timestamp.toISOString(),
      waste_type: wasteType,
      is_correct: isCorrect,
      inference_speed: 25 + Math.random() * 15 // Between 25-40 FPS
    });
  }
  
  return detections;
}

/**
 * Main function to seed the database
 */
async function seedDatabase() {
  console.log('Seeding historical data to Supabase...');
  
  // First, check if table exists by trying to select a record
  const { error: checkError } = await supabase
    .from('detections')
    .select('id')
    .limit(1);
  
  if (checkError) {
    console.error('Error checking table existence:', checkError);
    
    if (checkError.code === 'PGRST204') {
      console.error('The detections table does not exist. Please create it first.');
      console.error('Run the setup-database.sql script in the Supabase SQL editor.');
      process.exit(1);
    }
  }
  
  let totalInserted = 0;
  let errorCount = 0;
  
  // Process each historical data entry
  for (const dataPoint of historicalData) {
    console.log(`Processing data for ${dataPoint.year}-${dataPoint.month}...`);
    const detections = generateDetectionsFromHistoricalData(dataPoint);
    
    // Insert in batches of 20 (smaller batches to avoid timeouts)
    const batchSize = 20;
    for (let i = 0; i < detections.length; i += batchSize) {
      const batch = detections.slice(i, i + batchSize);
      const { error } = await supabase
        .from('detections')
        .insert(batch);
      
      if (error) {
        console.error(`Error inserting batch (${dataPoint.year}-${dataPoint.month}):`, error);
        errorCount++;
      } else {
        totalInserted += batch.length;
        process.stdout.write(`\rInserted ${totalInserted} records...`);
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log('\nDone!');
  console.log(`Successfully inserted ${totalInserted} records into the detections table.`);
  
  if (errorCount > 0) {
    console.warn(`Encountered ${errorCount} errors during insertion.`);
    console.warn('Some data may not have been inserted correctly.');
  }
}

// Run the seeding
seedDatabase().catch(error => {
  console.error('Error seeding database:', error);
  process.exit(1);
}); 