const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');

  try {
    // Update users without category to have 'GENERAL' as default
    const result = await mongoose.connection.collection('users').updateMany(
      { category: { $exists: false } },
      { $set: { category: 'GENERAL', isCategoryVerified: false } }
    );

    console.log(`Migration complete: ${result.modifiedCount} users updated to GENERAL category`);
    
    // Count users by category
    const categoryStats = await mongoose.connection.collection('users').aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]).toArray();

    console.log('Category distribution:');
    categoryStats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} users`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
});