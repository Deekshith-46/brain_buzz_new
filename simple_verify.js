// Simple verification of delivery records
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI);

const Delivery = require('./src/models/Purchase/Delivery');

async function simpleVerify() {
  try {
    console.log('=== SIMPLE DELIVERY VERIFICATION ===\n');
    
    // Find all deliveries without populate
    const deliveries = await Delivery.find().sort({ createdAt: -1 }).lean();
    
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
      console.log('User ID:', delivery.user);
      console.log('Publication ID:', delivery.publication);
      console.log('Order ID:', delivery.order);
      console.log('Created:', delivery.createdAt);
    });
    
    console.log('\n✅ VERIFICATION COMPLETE');
    console.log('These delivery records exist in the database.');
    console.log('The admin API /api/admin/deliveries should return them.');
    
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

simpleVerify();