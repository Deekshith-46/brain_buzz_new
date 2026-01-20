const mongoose = require('mongoose');

const testSeriesPurchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testSeries: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSeries',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  coupon: {
    code: String,
    discountAmount: Number
  }
}, { timestamps: true });

// Create a compound index to ensure one active purchase per user and test series
testSeriesPurchaseSchema.index(
  { user: 1, testSeries: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'completed' } }
);

module.exports = mongoose.model('TestSeriesPurchase', testSeriesPurchaseSchema);
