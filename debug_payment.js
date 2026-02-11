// Debug payment process to see why delivery isn't being created
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI);

const Order = require('./src/models/Order/Order');

async function debugPaymentProcess() {
  try {
    const orderId = '698c4d7387b797c8644ff2fc'; // Your recent order
    
    console.log('=== DEBUGGING PAYMENT PROCESS ===\n');
    
    // Check the order details
    const order = await Order.findById(orderId).lean();
    
    if (!order) {
      console.log('Order not found!');
      return;
    }
    
    console.log('Order Details:');
    console.log('  Order ID:', order._id);
    console.log('  Status:', order.status);
    console.log('  Payment Details Notes:', order.paymentDetails?.notes);
    
    // Check if deliveryAddress was in the original request
    const notes = order.paymentDetails?.notes;
    if (notes) {
      console.log('\nPayment Notes Analysis:');
      console.log('  Items:', notes.items);
      console.log('  User ID:', notes.userId);
      console.log('  Coupon Code:', notes.couponCode);
      console.log('  Amount:', notes.amountInRupees);
      console.log('  Delivery Address Present:', !!notes.deliveryAddress);
      if (notes.deliveryAddress) {
        console.log('  Delivery Address:', notes.deliveryAddress);
      }
    }
    
    // Check order items
    console.log('\nOrder Items:');
    order.items.forEach((item, idx) => {
      console.log(`  Item ${idx + 1}:`, {
        itemType: item.itemType,
        itemId: item.itemId,
        price: item.price
      });
    });
    
    // Check if this is a HARDCOPY publication
    const Publication = require('./src/models/Publication/Publication');
    const publicationId = order.items[0]?.itemId;
    if (publicationId) {
      const publication = await Publication.findById(publicationId).lean();
      console.log('\nPublication Details:');
      console.log('  Name:', publication?.name);
      console.log('  Available In:', publication?.availableIn);
      console.log('  Is HARDCOPY:', publication?.availableIn === 'HARDCOPY');
    }
    
    console.log('\n=== DEBUG COMPLETE ===');
    
  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugPaymentProcess();