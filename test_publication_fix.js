// Test script to verify publication purchase fix
const mongoose = require('mongoose');
const { PurchaseService } = require('./services');

// Connect to database
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI);

const Order = require('./src/models/Order/Order');
const Purchase = require('./src/models/Purchase/Purchase');

async function testPublicationAccess() {
  try {
    const userId = '698c4523221c149a6fb1cea9';
    const publicationId = '698b0ad15b5a39a046c39100';
    
    console.log('=== TESTING PUBLICATION ACCESS FIX ===\n');
    
    // Test 1: Check Purchase collection
    console.log('1. Checking Purchase collection:');
    const purchase = await Purchase.findOne({
      user: userId,
      'items.itemType': 'publication',
      'items.itemId': publicationId,
      status: 'completed'
    });
    console.log('Purchase found:', !!purchase);
    if (purchase) {
      console.log('  - Purchase ID:', purchase._id);
      console.log('  - Items:', purchase.items.map(i => `${i.itemType}:${i.itemId}`));
    }
    
    // Test 2: Check Order collection  
    console.log('\n2. Checking Order collection:');
    const order = await Order.findOne({
      user: userId,
      status: 'completed',
      'items.itemType': 'publication',
      'items.itemId': publicationId
    });
    console.log('Order found:', !!order);
    if (order) {
      console.log('  - Order ID:', order._id);
      console.log('  - Order items:', order.items.map(i => ({
        itemType: i.itemType,
        itemId: i.itemId,
        itemIdType: typeof i.itemId
      })));
    }
    
    // Test 3: Check what's actually in the database
    console.log('\n3. All user orders:');
    const allOrders = await Order.find({
      user: userId,
      status: 'completed'
    });
    console.log(`Found ${allOrders.length} completed orders`);
    
    allOrders.forEach((ord, idx) => {
      console.log(`  Order ${idx + 1}: ${ord._id}`);
      ord.items.forEach(item => {
        console.log(`    - ${item.itemType}:${item.itemId} (${typeof item.itemId})`);
      });
    });
    
    // Test 4: Use PurchaseService
    console.log('\n4. Testing PurchaseService.hasAccess():');
    const hasAccess = await PurchaseService.hasAccess(userId, 'publication', publicationId);
    console.log('PurchaseService.hasAccess result:', hasAccess);
    
    console.log('\n=== TEST COMPLETE ===');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testPublicationAccess();