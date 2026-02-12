#!/usr/bin/env node

/**
 * Migration Script: Convert existing data to validity-based pricing model
 * 
 * This script migrates existing Course and TestSeries documents from the old
 * single-price model to the new validity-based pricing structure.
 * 
 * BACKUP YOUR DATABASE BEFORE RUNNING THIS SCRIPT!
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Course = require('./src/models/Course/Course');
const TestSeries = require('./src/models/TestSeries/TestSeries');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/brainbuzz');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Migration function for Courses
const migrateCourses = async () => {
  console.log('\n=== Migrating Courses ===');
  
  try {
    // Find all courses that don't have validities array yet
    const courses = await Course.find({
      $or: [
        { validities: { $exists: false } },
        { validities: { $size: 0 } }
      ]
    });
    
    console.log(`Found ${courses.length} courses to migrate`);
    
    let migratedCount = 0;
    
    for (const course of courses) {
      try {
        // Create validity-based pricing from existing fields
        const validityOption = {
          label: course.validity || '1_YEAR',
          pricing: {
            originalPrice: course.originalPrice || 0,
            discountPrice: course.discountPrice || 0,
            finalPrice: Math.max(0, (course.originalPrice || 0) - (course.discountPrice || 0))
          }
        };
        
        // Update the course
        await Course.findByIdAndUpdate(course._id, {
          $set: {
            validities: [validityOption]
          }
        });
        
        console.log(`✓ Migrated course: ${course.name} (${course._id})`);
        migratedCount++;
      } catch (error) {
        console.error(`✗ Failed to migrate course ${course._id}:`, error.message);
      }
    }
    
    console.log(`Successfully migrated ${migratedCount}/${courses.length} courses`);
    return migratedCount;
  } catch (error) {
    console.error('Error migrating courses:', error);
    return 0;
  }
};

// Migration function for TestSeries
const migrateTestSeries = async () => {
  console.log('\n=== Migrating Test Series ===');
  
  try {
    // Find all test series that don't have validities array yet
    const testSeriesList = await TestSeries.find({
      $or: [
        { validities: { $exists: false } },
        { validities: { $size: 0 } }
      ]
    });
    
    console.log(`Found ${testSeriesList.length} test series to migrate`);
    
    let migratedCount = 0;
    
    for (const testSeries of testSeriesList) {
      try {
        // Calculate final price from existing discount structure
        let finalPrice = testSeries.originalPrice || 0;
        if (testSeries.discount?.type === 'percentage') {
          finalPrice = testSeries.originalPrice - (testSeries.originalPrice * testSeries.discount.value) / 100;
        } else if (testSeries.discount?.type === 'fixed') {
          finalPrice = testSeries.originalPrice - testSeries.discount.value;
        }
        finalPrice = Math.max(finalPrice, 0);
        
        // Create validity-based pricing from existing fields
        const validityOption = {
          label: testSeries.validity || '1_YEAR',
          pricing: {
            originalPrice: testSeries.originalPrice || 0,
            discountPrice: testSeries.discount?.value || 0,
            finalPrice: finalPrice
          }
        };
        
        // Update the test series
        await TestSeries.findByIdAndUpdate(testSeries._id, {
          $set: {
            validities: [validityOption]
          }
        });
        
        console.log(`✓ Migrated test series: ${testSeries.name} (${testSeries._id})`);
        migratedCount++;
      } catch (error) {
        console.error(`✗ Failed to migrate test series ${testSeries._id}:`, error.message);
      }
    }
    
    console.log(`Successfully migrated ${migratedCount}/${testSeriesList.length} test series`);
    return migratedCount;
  } catch (error) {
    console.error('Error migrating test series:', error);
    return 0;
  }
};

// Verification function
const verifyMigration = async () => {
  console.log('\n=== Verifying Migration ===');
  
  try {
    // Check courses
    const coursesWithoutValidities = await Course.countDocuments({
      $or: [
        { validities: { $exists: false } },
        { validities: { $size: 0 } }
      ]
    });
    
    // Check test series
    const testSeriesWithoutValidities = await TestSeries.countDocuments({
      $or: [
        { validities: { $exists: false } },
        { validities: { $size: 0 } }
      ]
    });
    
    console.log(`Courses without validities: ${coursesWithoutValidities}`);
    console.log(`Test series without validities: ${testSeriesWithoutValidities}`);
    
    if (coursesWithoutValidities === 0 && testSeriesWithoutValidities === 0) {
      console.log('✅ Migration verification passed - all documents have validities array');
      return true;
    } else {
      console.log('⚠️  Migration verification failed - some documents still lack validities array');
      return false;
    }
  } catch (error) {
    console.error('Error verifying migration:', error);
    return false;
  }
};

// Main migration function
const runMigration = async () => {
  console.log('🚀 Starting validity-based pricing migration...\n');
  console.log('⚠️  MAKE SURE YOU HAVE A DATABASE BACKUP BEFORE PROCEEDING!\n');
  
  await connectDB();
  
  try {
    // Run migrations
    const coursesMigrated = await migrateCourses();
    const testSeriesMigrated = await migrateTestSeries();
    
    // Verify results
    const verificationPassed = await verifyMigration();
    
    console.log('\n=== Migration Summary ===');
    console.log(`Courses migrated: ${coursesMigrated}`);
    console.log(`Test series migrated: ${testSeriesMigrated}`);
    console.log(`Verification: ${verificationPassed ? 'PASSED' : 'FAILED'}`);
    
    if (verificationPassed) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n❌ Migration completed with issues. Please check the logs above.');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
};

// Run the migration
if (require.main === module) {
  runMigration();
}

module.exports = {
  migrateCourses,
  migrateTestSeries,
  verifyMigration,
  runMigration
};