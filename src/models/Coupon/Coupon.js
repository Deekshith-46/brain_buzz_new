// models/Coupon/Coupon.js
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2'); // Add this line

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: String,
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minPurchaseAmount: {
    type: Number,
    default: 0
  },
  maxUses: {
    type: Number,
    default: null
  },
  maxUsesPerUser: {
    type: Number,
    default: null
  },
  usedCount: {
    type: Number,
    default: 0
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  applicableItems: [{
    itemType: {
      type: String,
      enum: ['test_series', 'online_course', 'all'],
      required: true
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'applicableItems.itemType'
    }
  }],
  // Default: if applicableItems is empty, coupon applies to all test_series and online_course
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Add pagination plugin
couponSchema.plugin(mongoosePaginate);

// Indexes
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ validUntil: 1, isActive: 1 });

module.exports = mongoose.model('Coupon', couponSchema);