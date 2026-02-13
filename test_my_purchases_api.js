const mongoose = require('mongoose');
const Purchase = require('./src/models/Purchase/Purchase');
const Course = require('./src/models/Course/Course');
const TestSeries = require('./src/models/TestSeries/TestSeries');
const Publication = require('./src/models/Publication/Publication');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/brainbuzz', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test user ID (replace with actual user ID from your database)
const TEST_USER_ID = '67890abcdef1234567890123'; // Replace with real user ID

async function testMyPurchasesAPI() {
  try {
    await connectDB();
    
    console.log('=== MY PURCHASES API TEST ===\n');
    
    // Test 1: Check user's purchases in database
    console.log('1. Checking user purchases in database:');
    const purchases = await Purchase.find({ 
      user: TEST_USER_ID,
      status: 'completed'
    }).populate('items.itemId');
    
    console.log(`Found ${purchases.length} completed purchases for user`);
    
    purchases.forEach((purchase, index) => {
      console.log(`\nPurchase ${index + 1}:`);
      console.log(`  ID: ${purchase._id}`);
      console.log(`  Status: ${purchase.status}`);
      console.log(`  Amount: ₹${purchase.finalAmount}`);
      console.log(`  Purchase Date: ${purchase.purchaseDate}`);
      console.log(`  Expiry Date: ${purchase.expiryDate}`);
      console.log(`  Items:`);
      purchase.items.forEach(item => {
        console.log(`    - ${item.itemType}: ${item.itemId}`);
      });
    });
    
    // Test 2: Check actual content items
    console.log('\n\n2. Checking actual content items:');
    
    // Get unique item IDs by type
    const courseIds = [...new Set(
      purchases.flatMap(p => 
        p.items
          .filter(i => i.itemType === 'online_course' && i.itemId)
          .map(i => i.itemId.toString())
      )
    )];
    
    const testSeriesIds = [...new Set(
      purchases.flatMap(p => 
        p.items
          .filter(i => i.itemType === 'test_series' && i.itemId)
          .map(i => i.itemId.toString())
      )
    )];
    
    const publicationIds = [...new Set(
      purchases.flatMap(p => 
        p.items
          .filter(i => i.itemType === 'publication' && i.itemId)
          .map(i => i.itemId.toString())
      )
    )];
    
    console.log(`Course IDs:`, courseIds);
    console.log(`Test Series IDs:`, testSeriesIds);
    console.log(`Publication IDs:`, publicationIds);
    
    // Test 3: Fetch actual content
    console.log('\n\n3. Fetching actual content details:');
    
    if (courseIds.length > 0) {
      const courses = await Course.find({
        _id: { $in: courseIds },
        isActive: true
      }).populate('categories subCategories languages');
      
      console.log(`\nFound ${courses.length} purchased courses:`);
      courses.forEach(course => {
        console.log(`  - ${course.name} (${course._id})`);
        console.log(`    Categories: ${course.categories?.map(c => c.name).join(', ') || 'None'}`);
        console.log(`    Languages: ${course.languages?.map(l => l.name).join(', ') || 'None'}`);
      });
    }
    
    if (testSeriesIds.length > 0) {
      const testSeries = await TestSeries.find({
        _id: { $in: testSeriesIds },
        isActive: true
      }).populate('categories subCategories languages');
      
      console.log(`\nFound ${testSeries.length} purchased test series:`);
      testSeries.forEach(series => {
        console.log(`  - ${series.name} (${series._id})`);
        console.log(`    Tests: ${series.tests?.length || 0}/${series.noOfTests}`);
        console.log(`    Categories: ${series.categories?.map(c => c.name).join(', ') || 'None'}`);
      });
    }
    
    if (publicationIds.length > 0) {
      const publications = await Publication.find({
        _id: { $in: publicationIds },
        isActive: true
      }).populate('categories subCategories languages');
      
      console.log(`\nFound ${publications.length} purchased publications:`);
      publications.forEach(pub => {
        console.log(`  - ${pub.name} (${pub._id})`);
        console.log(`    Available: ${pub.availableIn}`);
        console.log(`    Categories: ${pub.categories?.map(c => c.name).join(', ') || 'None'}`);
      });
    }
    
    // Test 4: Validate access status
    console.log('\n\n4. Access validation summary:');
    
    const now = new Date();
    let activeCount = 0;
    let expiredCount = 0;
    
    purchases.forEach(purchase => {
      const isValid = now <= purchase.expiryDate;
      if (isValid) {
        activeCount++;
      } else {
        expiredCount++;
      }
      console.log(`Purchase ${purchase._id}: ${isValid ? 'ACTIVE' : 'EXPIRED'} (expires: ${purchase.expiryDate})`);
    });
    
    console.log(`\nSummary:`);
    console.log(`  Total Purchases: ${purchases.length}`);
    console.log(`  Active Purchases: ${activeCount}`);
    console.log(`  Expired Purchases: ${expiredCount}`);
    console.log(`  Courses: ${courseIds.length}`);
    console.log(`  Test Series: ${testSeriesIds.length}`);
    console.log(`  Publications: ${publicationIds.length}`);
    
    console.log('\n=== TEST COMPLETE ===');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected');
  }
}

// Run the test
if (require.main === module) {
  testMyPurchasesAPI();
}

module.exports = { testMyPurchasesAPI };