/**
 * Migration script to backfill originalAmount and discountAmount for existing orders
 * This script should be run once to fix historical data without affecting the core architecture
 */

const mongoose = require('mongoose');
const Order = require('../src/models/Order/Order');
const Course = require('../src/models/Course/Course');
const TestSeries = require('../src/models/TestSeries/TestSeries');

async function migrateOrderPricing() {
  try {
    console.log('Starting order pricing migration...');
    
    // Find all orders that don't have originalAmount or pricing data
    const orders = await Order.find({
      $or: [
        { originalAmount: { $exists: false } },
        { originalAmount: null },
        { originalAmount: { $eq: null } },
        { pricing: { $exists: false } }
      ]
    });
    
    console.log(`Found ${orders.length} orders to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const order of orders) {
      try {
        let baseTotal = 0;
        let hasValidItems = true;
        
        // Calculate base total from items
        for (const item of order.items) {
          let itemPrice = 0;
          
          if (item.itemType.toLowerCase().includes('course')) {
            const course = await Course.findById(item.itemId);
            if (course && course.originalPrice) {
              itemPrice = course.originalPrice;
            } else if (course && course.discountPrice) {
              // If originalPrice not available, try to reconstruct from discountPrice
              itemPrice = course.originalPrice || course.discountPrice;
            } else {
              console.log(`Warning: Course ${item.itemId} not found or has no price data for order ${order._id}`);
              hasValidItems = false;
              break;
            }
          } else if (item.itemType.toLowerCase().includes('test')) {
            const testSeries = await TestSeries.findById(item.itemId);
            if (testSeries && testSeries.price) {
              itemPrice = testSeries.price; // Assuming price field for test series
            } else {
              console.log(`Warning: TestSeries ${item.itemId} not found or has no price data for order ${order._id}`);
              hasValidItems = false;
              break;
            }
          } else {
            console.log(`Warning: Unknown itemType ${item.itemType} for order ${order._id}`);
            hasValidItems = false;
            break;
          }
          
          // Account for quantity if available
          const quantity = item.quantity || 1;
          baseTotal += itemPrice * quantity;
        }
        
        if (!hasValidItems) {
          console.log(`Skipping order ${order._id} due to invalid items`);
          skippedCount++;
          continue;
        }
        
        // Calculate discount amount
        const discountAmount = Math.max(0, baseTotal - order.amount);
        
        // For migration, we can't separate product vs coupon discounts easily
        // So we'll use the total discount amount
        
        // Update the order with calculated values
        await Order.updateOne(
          { _id: order._id },
          {
            $set: {
              originalAmount: baseTotal,
              discountAmount: discountAmount,
              pricing: {
                baseTotal: baseTotal,
                productDiscount: 0, // Cannot determine from existing data
                couponDiscount: discountAmount, // Assign all to coupon for now
                finalAmount: order.amount
              }
            }
          }
        );
        
        console.log(`Successfully migrated order ${order._id}: originalAmount=${baseTotal}, discountAmount=${discountAmount}`);
        migratedCount++;
        
      } catch (itemError) {
        console.error(`Error processing order ${order._id}:`, itemError.message);
        skippedCount++;
      }
    }
    
    console.log(`Migration completed!`);
    console.log(`- Migrated: ${migratedCount} orders`);
    console.log(`- Skipped: ${skippedCount} orders`);
    console.log(`- Total processed: ${orders.length} orders`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Connect to database and run migration
async function runMigration() {
  try {
    // Use the same MongoDB URI as in your .env
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/brainbuzz';
    
    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);
    
    console.log('Database connected successfully');
    
    await migrateOrderPricing();
    
    console.log('Closing database connection...');
    await mongoose.connection.close();
    console.log('Migration script completed successfully!');
    
  } catch (error) {
    console.error('Failed to run migration:', error);
    process.exit(1);
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = migrateOrderPricing;