const mongoose = require('mongoose');
const Course = require('./src/models/Course/Course');
const TestSeries = require('./src/models/TestSeries/TestSeries');
const Publication = require('./src/models/Publication/Publication');

async function migrateDiscountFields() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/brainbuzz', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Migrate Courses
    console.log('\nMigrating Courses...');
    const courses = await Course.find({});
    let courseUpdateCount = 0;

    for (const course of courses) {
      let hasUpdates = false;
      
      // Remove deprecated fields
      if (course.discountPrice !== undefined) {
        delete course.discountPrice;
        hasUpdates = true;
      }
      if (course.originalPrice !== undefined) {
        delete course.originalPrice;
        hasUpdates = true;
      }
      if (course.discountPercent !== undefined) {
        delete course.discountPercent;
        hasUpdates = true;
      }
      if (course.validity !== undefined) {
        delete course.validity;
        hasUpdates = true;
      }
      if (course.finalPrice !== undefined) {
        delete course.finalPrice;
        hasUpdates = true;
      }
      
      // Migrate validity-based pricing discountPrice to discountValue
      if (course.validities && course.validities.length > 0) {
        for (const validity of course.validities) {
          if (validity.pricing && validity.pricing.discountPrice !== undefined && validity.pricing.discountValue === undefined) {
            validity.pricing.discountValue = validity.pricing.discountPrice;
            // Set default discountType based on whether the value looks like a percentage or fixed amount
            if (validity.pricing.discountPrice > 0 && validity.pricing.discountPrice <= 100 && validity.pricing.originalPrice && validity.pricing.discountPrice / validity.pricing.originalPrice * 100 <= 100) {
              validity.pricing.discountType = 'percentage';
            } else {
              validity.pricing.discountType = 'fixed';
            }
            delete validity.pricing.discountPrice; // Remove old field
            hasUpdates = true;
          }
        }
      }
      
      if (hasUpdates) {
        await course.save();
        courseUpdateCount++;
      }
    }
    
    console.log(`Updated ${courseUpdateCount} courses`);

    // Migrate TestSeries
    console.log('\nMigrating Test Series...');
    const testSeriesList = await TestSeries.find({});
    let testSeriesUpdateCount = 0;

    for (const testSeries of testSeriesList) {
      let hasUpdates = false;
      
      // Remove deprecated fields
      if (testSeries.originalPrice !== undefined) {
        delete testSeries.originalPrice;
        hasUpdates = true;
      }
      if (testSeries.finalPrice !== undefined) {
        delete testSeries.finalPrice;
        hasUpdates = true;
      }
      if (testSeries.discount !== undefined) {
        delete testSeries.discount;
        hasUpdates = true;
      }
      if (testSeries.validity !== undefined) {
        delete testSeries.validity;
        hasUpdates = true;
      }
      
      // Remove deprecated fields from validity-based pricing
      if (testSeries.validities && testSeries.validities.length > 0) {
        for (const validity of testSeries.validities) {
          if (validity.pricing && validity.pricing.discountPrice !== undefined) {
            delete validity.pricing.discountPrice; // Remove old field
            hasUpdates = true;
          }
        }
      }
      
      if (hasUpdates) {
        await testSeries.save();
        testSeriesUpdateCount++;
      }
    }
    
    console.log(`Updated ${testSeriesUpdateCount} test series`);

    // Migrate Publications
    console.log('\nMigrating Publications...');
    const publications = await Publication.find({});
    let publicationUpdateCount = 0;

    for (const publication of publications) {
      let hasUpdates = false;
      
      // Remove deprecated fields
      if (publication.discountPrice !== undefined) {
        delete publication.discountPrice;
        hasUpdates = true;
      }
      if (publication.originalPrice !== undefined) {
        delete publication.originalPrice;
        hasUpdates = true;
      }
      if (publication.discountPercent !== undefined) {
        delete publication.discountPercent;
        hasUpdates = true;
      }
      if (publication.finalPrice !== undefined) {
        delete publication.finalPrice;
        hasUpdates = true;
      }
      if (publication.validity !== undefined) {
        delete publication.validity;
        hasUpdates = true;
      }
      
      if (hasUpdates) {
        await publication.save();
        publicationUpdateCount++;
      }
    }
    
    console.log(`Updated ${publicationUpdateCount} publications`);

    console.log('\nMigration completed successfully!');
    console.log('Summary:');
    console.log(`- Courses updated: ${courseUpdateCount}`);
    console.log(`- Test Series updated: ${testSeriesUpdateCount}`);
    console.log(`- Publications updated: ${publicationUpdateCount}`);

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  migrateDiscountFields();
}

module.exports = migrateDiscountFields;