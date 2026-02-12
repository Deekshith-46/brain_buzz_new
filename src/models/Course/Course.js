const mongoose = require('mongoose');

const tutorSchema = new mongoose.Schema(
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

const classSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    lecturePhotoUrl: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      trim: true,
    },
    isFree: {
      type: Boolean,
      default: false
    },
    
  },
  { _id: true }
);

const studyMaterialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const courseSchema = new mongoose.Schema(
  {
    contentType: {
      type: String,
      enum: [
        'ONLINE_COURSE',
        'TEST_SERIES',
        'LIVE_CLASS',
        'PUBLICATION',
        'DAILY_QUIZ',
        'CURRENT_AFFAIRS',
        'PYQ_EBOOK',
      ],
      default: 'ONLINE_COURSE',
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
    courseType: {
      type: String,
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
    // NEW: Validity-based pricing structure
    validities: [
      {
        label: {
          type: String,
          enum: require('../../constants/validityMap').VALIDITY_LABELS,
          required: true
        },
        pricing: {
          originalPrice: {
            type: Number,
            required: true,
            min: 0
          },
          discountValue: {
            type: Number,
            default: 0,
            min: 0
          },
          discountType: {
            type: String,
            enum: ['percentage', 'fixed', null],
            default: null
          },
          finalPrice: {
            type: Number,
            required: true,
            min: 0
          }
        }
      }
    ],
    thumbnailUrl: {
      type: String,
      trim: true,
    },

    
    // NEW: Validity-based pricing structure is defined above with the validity field
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
    tutors: [tutorSchema],
    classes: [classSchema],
    studyMaterials: [studyMaterialSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add a pre-save hook to automatically calculate final prices for validity options
courseSchema.pre('save', function(next) {
  // Calculate final prices for each validity option
  if (this.validities && this.validities.length > 0) {
    this.validities.forEach(validityOption => {
      const base = validityOption.pricing.originalPrice || 0;
      const discountValue = validityOption.pricing.discountValue || 0;
      const discountType = validityOption.pricing.discountType || 'fixed';
      
      let finalPrice;
      if (discountType === 'percentage') {
        const calculatedDiscount = (base * discountValue) / 100;
        finalPrice = base - calculatedDiscount;
      } else {
        // fixed discount type
        finalPrice = base - discountValue;
      }
      
      validityOption.pricing.finalPrice = Math.max(Math.round(finalPrice * 100) / 100, 0);
    });
  }
  
  next();
});

// Add a pre-save hook to validate categories and subcategories match the content type
courseSchema.pre('save', async function(next) {
  if (this.categories && this.categories.length > 0) {
    const Category = require('./Category');
    for (const categoryId of this.categories) {
      const category = await Category.findById(categoryId);
      if (category && category.contentType !== this.contentType) {
        return next(new Error(`Category ${category.name} does not match content type ${this.contentType}`));
      }
    }
  }
  
  if (this.subCategories && this.subCategories.length > 0) {
    const SubCategory = require('./SubCategory');
    for (const subCategoryId of this.subCategories) {
      const subCategory = await SubCategory.findById(subCategoryId);
      if (subCategory && subCategory.contentType !== this.contentType) {
        return next(new Error(`SubCategory ${subCategory.name} does not match content type ${this.contentType}`));
      }
    }
  }
  
  next();
});

module.exports = mongoose.model('Course', courseSchema);