// models/Purchase/Purchase.js
const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ['test_series', 'online_course'],
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'items.itemType'
  },
  contentType: {
    type: String,
    required: true
  }
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [purchaseItemSchema],
  amount: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  coupon: {
    code: String,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    discountValue: Number
  },
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  }
}, { timestamps: true });

// Indexes
purchaseSchema.index({ user: 1, status: 1 });
// Note: paymentId already has a unique index from schema definition (line 47-48)
purchaseSchema.index({ 'items.itemType': 1, 'items.itemId': 1, user: 1, status: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);