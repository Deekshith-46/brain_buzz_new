// Debug script to check delivery records
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI);

const Delivery = require('./src/models/Purchase/Delivery');
const Order = require('./src/models/Order/Order');

async function debugDeliveryIssue() {
  try {
    const userId = '698c4787727d54269d216a9c';
    const publicationId = '698b0afe5b5a39a046c39106';
    const orderId = '698c4a07d8883dfcb1af2803';
    
    console.log('=== DEBUGGING DELIVERY ISSUE ===\n');
    
    // Check if delivery record exists
    console.log('1. Checking for delivery records:');
    const deliveries = await Delivery.find({ user: userId }).lean();
    console.log(`Found ${deliveries.length} delivery records for user`);
    
    deliveries.forEach((delivery, idx) => {
      console.log(`  Delivery ${idx + 1}:`, {
        id: delivery._id,
        publication: delivery.publication,
        order: delivery.order,
        status: delivery.status
      });
    });
    
    // Check the specific order
    console.log('\n2. Checking the specific order:');
    const order = await Order.findById(orderId).lean();
    console.log('Order delivery address in paymentDetails:', order?.paymentDetails?.notes?.deliveryAddress);
    
    // Check if publication is HARDCOPY
    const Publication = require('./src/models/Publication/Publication');
    const publication = await Publication.findById(publicationId).lean();
    console.log('\n3. Publication details:');
    console.log('  Name:', publication?.name);
    console.log('  Available In:', publication?.availableIn);
    
    console.log('\n=== DEBUG COMPLETE ===');
    
  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugDeliveryIssue();