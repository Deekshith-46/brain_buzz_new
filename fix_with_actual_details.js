// Script to create delivery record with actual customer details from screenshot
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI);

const Delivery = require('./src/models/Purchase/Delivery');

async function createDeliveryWithActualDetails() {
  try {
    const userId = '698c4d0887b797c8644ff2d5';
    const publicationId = '698b0afe5b5a39a046c39106';
    const orderId = '698c4ead1c8c4701b2b9c5a9'; // Your latest order
    
    console.log('=== CREATING DELIVERY RECORD WITH ACTUAL CUSTOMER DETAILS ===\n');
    
    // Create delivery record with the actual details from your form
    const deliveryData = {
      user: userId,
      publication: publicationId,
      order: orderId,
      fullName: 'user new 16',
      phone: '5272942518',
      email: 'abc@gmail.com',
      addressLine: 'Near kukatapply',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500085',
      status: 'pending'
    };
    
    const delivery = await Delivery.create(deliveryData);
    
    console.log('✅ Delivery record created successfully with actual customer details!');
    console.log('Delivery ID:', delivery._id);
    console.log('Customer Name:', delivery.fullName);
    console.log('Phone:', delivery.phone);
    console.log('Email:', delivery.email);
    console.log('Address:', delivery.addressLine);
    console.log('City:', delivery.city);
    console.log('State:', delivery.state);
    console.log('Pincode:', delivery.pincode);
    console.log('Status:', delivery.status);
    console.log('Created At:', delivery.createdAt);
    
    // Verify it was created
    console.log('\n=== VERIFICATION ===');
    console.log('Linked to Order ID:', orderId);
    console.log('Linked to Publication:', publicationId);
    
    console.log('\n✅ Fix completed! Admin should now see this delivery record with actual customer details.');
    
  } catch (error) {
    console.error('Failed to create delivery record:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createDeliveryWithActualDetails();