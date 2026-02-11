// Script to manually create missing delivery record
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI);

const Delivery = require('./src/models/Purchase/Delivery');

async function createMissingDelivery() {
  try {
    const userId = '698c4787727d54269d216a9c';
    const publicationId = '698b0afe5b5a39a046c39106';
    const orderId = '698c4a07d8883dfcb1af2803';
    
    console.log('=== CREATING MISSING DELIVERY RECORD ===\n');
    
    // Create delivery record with sample address (you can update this)
    const deliveryData = {
      user: userId,
      publication: publicationId,
      order: orderId,
      fullName: 'John Doe',
      phone: '9876543210',
      email: 'john@example.com',
      addressLine: '123 Main Street',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      status: 'pending'
    };
    
    const delivery = await Delivery.create(deliveryData);
    
    console.log('✅ Delivery record created successfully!');
    console.log('Delivery ID:', delivery._id);
    console.log('Status:', delivery.status);
    console.log('Created At:', delivery.createdAt);
    
    // Verify it was created
    const verifyDelivery = await Delivery.findById(delivery._id)
      .populate('user', 'firstName lastName email')
      .populate('publication', 'name availableIn')
      .populate('order', 'orderId status')
      .lean();
      
    console.log('\n=== VERIFICATION ===');
    console.log('User:', verifyDelivery.user?.firstName, verifyDelivery.user?.lastName);
    console.log('Publication:', verifyDelivery.publication?.name);
    console.log('Order ID:', verifyDelivery.order?.orderId);
    console.log('Status:', verifyDelivery.status);
    
    console.log('\n✅ Fix completed! Admin should now see this delivery record.');
    
  } catch (error) {
    console.error('Failed to create delivery record:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createMissingDelivery();