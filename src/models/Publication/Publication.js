const mongoose = require('mongoose');
const { PUBLICATION_AVAILABILITY } = require('../../constants/enums');

const authorSchema = new mongoose.Schema(
  {
    photoUrl: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    qualification: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

const publicationSchema = new mongoose.Schema(
  {
    // Fixed type to distinguish in UI/filters if needed
    contentType: {
      type: String,
      default: 'PUBLICATION',
      immutable: true,
    },
    accessType: {
      type: String,
      enum: ["FREE", "PAID"],
      default: "PAID"
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    subCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
      },
    ],
    languages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Language',
      },
    ],
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    // Legacy pricing fields (kept for backward compatibility)
    originalPrice: {
      type: Number,
      min: 0,
    },
    discountValue: {
      type: Number,
      min: 0,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'fixed'
    },
    discountPercent: {
      type: Number,
      min: 0,
      max: 100,
    },
    // ✅ NEW: Final price calculation (originalPrice - discountPrice)
    finalPrice: {
      type: Number,
      min: 0,
    },
    availableIn: {
      type: String,
      enum: Object.values(PUBLICATION_AVAILABILITY),
      required: true,
      trim: true,
    },
    pricingNote: {
      type: String,
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
    },
    detailedDescription: {
      type: String,
      trim: true,
    },
    authors: [authorSchema],
    galleryImages: [
      {
        type: String,
        trim: true,
      },
    ],
    bookFileUrl: {
      type: String,
      trim: true,
    },
    // ✅ NEW: Digital access control fields
    isPreviewEnabled: {
      type: Boolean,
      default: false
    },
    previewPages: {
      type: Number,
      default: 2, // fixed preview pages - admin only toggles isPreviewEnabled
      immutable: true
    },
    previewFileUrl: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add a pre-save hook to automatically calculate and update finalPrice
publicationSchema.pre('save', function(next) {
  // Calculate finalPrice and discountPercent based on discountType
  if (this.originalPrice !== undefined) {
    const basePrice = this.originalPrice || 0;
    const discountValue = this.discountValue || 0;
    const discountType = this.discountType || 'fixed'; // Default to fixed if not set
    
    if (discountType === 'percentage') {
      // If discountType is percentage, calculate discount amount from percentage
      // Cap percentage at 100%
      const cappedPercentage = Math.min(discountValue, 100);
      const discountAmount = (basePrice * cappedPercentage) / 100;
      this.finalPrice = Math.max(basePrice - discountAmount, 0);
      this.discountPercent = cappedPercentage; // Use capped percentage
    } else {
      // If discountType is fixed, treat discountValue as fixed amount
      // Cap discount amount at original price
      const cappedDiscount = Math.min(discountValue, basePrice);
      const discountAmount = cappedDiscount;
      this.finalPrice = Math.max(basePrice - discountAmount, 0);
      // Calculate discountPercent based on originalPrice and discount amount
      if (basePrice > 0 && discountAmount !== undefined) {
        this.discountPercent = ((discountAmount / basePrice) * 100);
      } else {
        this.discountPercent = 0;
      }
    }
  }
  
  next();
});

// Add a pre-save hook to validate categories and subcategories match the content type
publicationSchema.pre('save', async function(next) {
  if (this.categories && this.categories.length > 0) {
    const Category = require('../Course/Category');
    for (const categoryId of this.categories) {
      const category = await Category.findById(categoryId);
      if (category && category.contentType !== this.contentType) {
        return next(new Error(`Category ${category.name} does not match content type ${this.contentType}`));
      }
    }
  }
  
  if (this.subCategories && this.subCategories.length > 0) {
    const SubCategory = require('../Course/SubCategory');
    for (const subCategoryId of this.subCategories) {
      const subCategory = await SubCategory.findById(subCategoryId);
      if (subCategory && subCategory.contentType !== this.contentType) {
        return next(new Error(`SubCategory ${subCategory.name} does not match content type ${this.contentType}`));
      }
    }
  }
  
  next();
});

module.exports = mongoose.model('Publication', publicationSchema);