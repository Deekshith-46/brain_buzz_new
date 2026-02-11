const mongoose = require('mongoose');
const Course = require('../src/models/Course/Course');
const TestSeries = require('../src/models/TestSeries/TestSeries');
const Publication = require('../src/models/Publication/Publication');

// Map common duration values to new validity enum labels
// These are standard mappings based on typical validity periods
const durationToValidityMap = {
  30: '1_MONTH',
  60: '2_MONTHS',
  90: '3_MONTHS',
  120: '4_MONTHS',
  150: '5_MONTHS',
  180: '6_MONTHS',
  365: '1_YEAR',
  730: '2_YEARS',
  1825: '5_YEARS'
};

// Additional common durations that might exist in your database
const additionalDurationMap = {
  7: '1_WEEK',
  14: '2_WEEKS',
  21: '3_WEEKS',
  28: '4_WEEKS',
  45: '1_MONTH_15_DAYS',
  270: '9_MONTHS',
  360: '12_MONTHS',
  540: '18_MONTHS',
  1095: '3_YEARS'
};

// Default validity for unmapped durations
const DEFAULT_VALIDITY = '1_YEAR';

async function migrateValidityEnums() {
  try {
    console.log('Starting validity enum migration...');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/brainbuzz', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Migrate Courses
    console.log('\nMigrating Courses...');
    const courses = await Course.find({});
    let courseCount = 0;
    const unmappedDurations = new Set();
    
    for (const course of courses) {
      let hasChanges = false;
      
      // Handle courses with validities array (old format)
      if (course.validities && course.validities.length > 0) {
        // Since we can't access ValidityOption collection anymore,
        // we'll use a default mapping strategy
        // Most common case: set to 1_YEAR
        const newValidity = DEFAULT_VALIDITY;
        course.validity = newValidity;
        hasChanges = true;
        console.log(`Course ${course.name}: Converted validities array to ${newValidity}`);
      } else if (!course.validity) {
        // Set default for courses without validities
        course.validity = DEFAULT_VALIDITY;
        hasChanges = true;
        console.log(`Course ${course.name}: No validity set, defaulting to ${DEFAULT_VALIDITY}`);
      }
      
      if (hasChanges) {
        await course.save();
        courseCount++;
      }
    }
    
    console.log(`Updated ${courseCount} courses`);
    
    // Migrate TestSeries
    console.log('\nMigrating TestSeries...');
    const testSeries = await TestSeries.find({});
    let testSeriesCount = 0;
    
    for (const series of testSeries) {
      let hasChanges = false;
      
      // Handle test series with validity as ObjectId (old format)
      if (series.validity && mongoose.Types.ObjectId.isValid(series.validity)) {
        // Convert ObjectId to default validity
        const newValidity = DEFAULT_VALIDITY;
        series.validity = newValidity;
        hasChanges = true;
        console.log(`TestSeries ${series.name}: Converted ObjectId validity to ${newValidity}`);
      } else if (!series.validity) {
        // Set default for test series without validity
        series.validity = DEFAULT_VALIDITY;
        hasChanges = true;
        console.log(`TestSeries ${series.name}: No validity set, defaulting to ${DEFAULT_VALIDITY}`);
      }
      
      if (hasChanges) {
        await series.save();
        testSeriesCount++;
      }
    }
    
    console.log(`Updated ${testSeriesCount} test series`);
    
    // Migrate Publications
    console.log('\nMigrating Publications...');
    const publications = await Publication.find({});
    let publicationCount = 0;
    
    for (const publication of publications) {
      let hasChanges = false;
      
      // Handle publications with validities array (old format)
      if (publication.validities && publication.validities.length > 0) {
        // Convert validities array to single validity
        const newValidity = DEFAULT_VALIDITY;
        publication.validity = newValidity;
        hasChanges = true;
        console.log(`Publication ${publication.name}: Converted validities array to ${newValidity}`);
      } else if (!publication.validity) {
        // Set default for publications without validities
        publication.validity = DEFAULT_VALIDITY;
        hasChanges = true;
        console.log(`Publication ${publication.name}: No validity set, defaulting to ${DEFAULT_VALIDITY}`);
      }
      
      if (hasChanges) {
        await publication.save();
        publicationCount++;
      }
    }
    
    console.log(`Updated ${publicationCount} publications`);
    
    console.log('\nMigration completed successfully!');
    console.log(`Total documents updated: ${courseCount + testSeriesCount + publicationCount}`);
    console.log('\n⚠️  IMPORTANT: All existing validity data has been converted to default values.');
    console.log('   Please review and manually update any documents that need specific validity periods.');
    console.log(`   Default validity used: ${DEFAULT_VALIDITY}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run migration if script is called directly
if (require.main === module) {
  migrateValidityEnums();
}

module.exports = { migrateValidityEnums };