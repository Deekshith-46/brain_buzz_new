// Script to create delivery record for the new order
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI);

const Delivery = require('./src/models/Purchase/Delivery');

async function createDeliveryForNewOrder() {
  try {
    const userId = '698c4d0887b797c8644ff2d5';
    const publicationId = '698b0afe5b5a39a046c39106';
    const orderId = '698c4d7387b797c8644ff2fc';
    
    console.log('=== CREATING DELIVERY RECORD FOR NEW ORDER ===\n');
    
    // Create delivery record with sample address (you can update this with actual customer details)
    const deliveryData = {
      user: userId,
      publication: publicationId,
      order: orderId,
      fullName: 'Customer Name',
      phone: '9876543210',
      email: 'customer@example.com',
      addressLine: 'Customer Address Line 1',
      city: 'Customer City',
      state: 'Customer State',
      pincode: '123456',
      status: 'pending'
    };
    
    const delivery = await Delivery.create(deliveryData);
    
    console.log('✅ Delivery record created successfully!');
    console.log('Delivery ID:', delivery._id);
    console.log('Status:', delivery.status);
    console.log('Created At:', delivery.createdAt);
    
    // Verify it was created
    console.log('\n=== VERIFICATION ===');
    console.log('Linked to Order ID:', orderId);
    console.log('Linked to Publication:', publicationId);
    console.log('Delivery Status:', delivery.status);
    
    console.log('\n✅ Fix completed! Admin should now see this delivery record.');
    
  } catch (error) {
    console.error('Failed to create delivery record:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createDeliveryForNewOrder();