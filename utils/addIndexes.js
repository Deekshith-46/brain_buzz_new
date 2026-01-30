/**
 * Script to add necessary database indexes for performance optimization
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Import models
const TestAttempt = require('../src/models/TestSeries/TestAttempt');
const TestRanking = require('../src/models/TestSeries/TestRanking');
const Purchase = require('../src/models/Purchase/Purchase');
const TestSeries = require('../src/models/TestSeries/TestSeries');

async function addIndexes() {
  try {
    // Connect to MongoDB
    const dbURI = process.env.DB_URI || 'mongodb://localhost:27017/brainbuzz';
    await mongoose.connect(dbURI);
    
    console.log('Connected to MongoDB');

    // Add indexes for TestAttempt collection
    await TestAttempt.collection.createIndex({ user: 1, testSeries: 1, testId: 1 });
    await TestAttempt.collection.createIndex({ resultGenerated: 1 });
    await TestAttempt.collection.createIndex({ user: 1, testSeries: 1, testId: 1, resultGenerated: 1 });
    await TestAttempt.collection.createIndex({ createdAt: 1 });
    
    console.log('Added indexes for TestAttempt collection');

    // Add indexes for TestRanking collection
    await TestRanking.collection.createIndex({ testId: 1 });
    await TestRanking.collection.createIndex({ testId: 1, score: -1 });
    await TestRanking.collection.createIndex({ testId: 1, user: 1 });
    await TestRanking.collection.createIndex({ score: -1 });
    
    console.log('Added indexes for TestRanking collection');

    // Add indexes for Purchase collection
    await Purchase.collection.createIndex({ user: 1, "items.itemId": 1, "items.itemType": 1 });
    await Purchase.collection.createIndex({ "items.itemId": 1, "items.itemType": 1 });
    await Purchase.collection.createIndex({ user: 1 });
    
    console.log('Added indexes for Purchase collection');

    // Add indexes for TestSeries collection
    await TestSeries.collection.createIndex({ contentType: 1 });
    await TestSeries.collection.createIndex({ isActive: 1 });
    await TestSeries.collection.createIndex({ categories: 1 });
    await TestSeries.collection.createIndex({ subCategories: 1 });
    await TestSeries.collection.createIndex({ languages: 1 });
    await TestSeries.collection.createIndex({ contentType: 1, isActive: 1 });
    
    console.log('Added indexes for TestSeries collection');

    console.log('\nAll indexes created successfully!');
    console.log('\nPerformance improvements:');
    console.log('- TestAttempt queries by user/test will be faster');
    console.log('- Ranking calculations will be more efficient');
    console.log('- Purchase lookups will be optimized');
    console.log('- TestSeries filtering will be faster');

  } catch (error) {
    console.error('Error adding indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script if called directly
if (require.main === module) {
  addIndexes().then(() => {
    console.log('Index creation completed.');
    process.exit(0);
  }).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = addIndexes;