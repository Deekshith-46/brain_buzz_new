/**
 * Script to run the order pricing migration
 */

require('dotenv').config();
const migrateOrderPricing = require('./utils/migrateOrderPricing');

console.log('Running order pricing migration...');
console.log('This will backfill originalAmount and discountAmount for existing orders...');
console.log('Make sure your MongoDB is running before proceeding.');
console.log('');

// Confirm before running
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Do you want to proceed with the migration? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    migrateOrderPricing()
      .then(() => {
        console.log('\nMigration completed successfully!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\nMigration failed:', error);
        process.exit(1);
      });
  } else {
    console.log('Migration cancelled.');
    process.exit(0);
  }
  
  rl.close();
});