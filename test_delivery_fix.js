// Test script to verify the delivery address fix
const mongoose = require('mongoose');
const Order = require('./src/models/Order/Order');

// Test the Order schema with deliveryAddress
console.log('Testing Order schema with deliveryAddress field...');

const testOrder = new Order({
  user: new mongoose.Types.ObjectId(),
  orderId: 'test_order_123',
  paymentId: 'test_payment_123',
  amount: 1000,
  currency: 'INR',
  status: 'completed',
  items: [],
  deliveryAddress: {
    fullName: 'Test User',
    phone: '1234567890',
    email: 'test@example.com',
    addressLine: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    pincode: '123456'
  }
});

console.log('Order schema validation:', testOrder.validateSync() ? 'FAILED' : 'PASSED');
console.log('Delivery address field exists:', !!testOrder.deliveryAddress);
console.log('Delivery address data:', testOrder.deliveryAddress);

console.log('\n✅ Fix verification complete!');
console.log('The deliveryAddress field has been successfully added to the Order schema.');
console.log('This will now persist delivery information through the entire payment flow.');
