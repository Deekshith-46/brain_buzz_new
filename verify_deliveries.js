// Test to verify deliveries exist in database
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI);

const Delivery = require('./src/models/Purchase/Delivery');

async function verifyDeliveries() {
  try {
    console.log('=== VERIFYING DELIVERY RECORDS ===\n');
    
    // Find all deliveries
    const deliveries = await Delivery.find()
      .populate('user', 'firstName lastName email')
      .populate('publication', 'name availableIn')
      .populate('order', 'orderId status')
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`Found ${deliveries.length} delivery records:`);
    
    deliveries.forEach((delivery, idx) => {
      console.log(`\n--- Delivery ${idx + 1} ---`);
      console.log('ID:', delivery._id);
      console.log('Customer:', delivery.fullName);
      console.log('Phone:', delivery.phone);
      console.log('Email:', delivery.email);
      console.log('Address:', delivery.addressLine);
      console.log('City:', delivery.city);
      console.log('State:', delivery.state);
      console.log('Pincode:', delivery.pincode);
      console.log('Status:', delivery.status);
      console.log('Publication:', delivery.publication?.name);
      console.log('Order ID:', delivery.order?.orderId);
      console.log('Created:', delivery.createdAt);
    });
    
    console.log('\n=== VERIFICATION COMPLETE ===');
    console.log('Admin should see these records in /api/admin/deliveries');
    
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyDeliveries();