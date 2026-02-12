// src/models/Order/Order.js
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

const orderItemSchema = new Schema({
  itemType: {
    type: String,
    enum: ['TestSeries', 'Course', 'testSeries', 'course', 'publication', 'test_series', 'online_course'], // Support all formats
    required: true
  },
  itemId: {
    type: Schema.Types.ObjectId,
    required: true
    // We'll handle populate manually in the controller
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  validity: {
    type: String,
    enum: ['1_MONTH', '2_MONTHS', '3_MONTHS', '4_MONTHS', '5_MONTHS', 
           '6_MONTHS', '1_YEAR', '2_YEARS', '5_YEARS', 'UNLIMITED'],
    required: false
  }
}, { _id: false });

const orderSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  paymentId: String,
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  items: [orderItemSchema],
  coupon: {
    code: String,
    discountType: String,
    discountValue: Number
  },
  paymentDetails: Object,
  originalAmount: Number,
  discountAmount: Number,
  pricing: Object,
  shippingAddress: Object,
  billingAddress: Object,
  deliveryAddress: {
    fullName: String,
    phone: String,
    email: String,
    addressLine: String,
    city: String,
    state: String,
    pincode: String
  }
}, { timestamps: true });

// Add pagination plugin
orderSchema.plugin(mongoosePaginate);

// Add indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
// Note: orderId and paymentId already have unique indexes from schema definition

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;