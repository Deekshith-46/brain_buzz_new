const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const questionSchema = new mongoose.Schema(
  {
    questionNumber: {
      type: Number,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    options: [
      {
        type: String,
        trim: true,
      },
    ],
    correctOptionIndex: {
      type: Number,
    },
    explanation: {
      type: String,
      trim: true,
    },
    marks: {
      type: Number,
      default: 1,
    },
    negativeMarks: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const sectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
    },
    noOfQuestions: {
      type: Number,
    },
    questions: [questionSchema],
  },
  { _id: true }
);

const testSchema = new mongoose.Schema(
  {
    testName: {
      type: String,
      required: true,
      trim: true,
    },
    noOfQuestions: {
      type: Number,
    },
    totalMarks: {
      type: Number,
    },
    positiveMarks: {
      type: Number,
    },
    negativeMarks: {
      type: Number,
    },
    date: {
      type: Date,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    instructionsPage1: {
      type: String,
      trim: true,
    },
    instructionsPage2: {
      type: String,
      trim: true,
    },
    instructionsPage3: {
      type: String,
      trim: true,
    },
    totalExplanationVideoUrl: {
      type: String,
      trim: true,
    },
    resultPublishTime: {
      type: Date,
    },
    durationInSeconds: {
      type: Number,
      required: true,
      default: 3600  // 1 hour default
    },
    sections: [sectionSchema],
  },
  { _id: true }
);

const testSeriesSchema = new Schema(
  {
    contentType: {
      type: String,
      default: 'TEST_SERIES',
      immutable: true,
    },
    accessType: {
      type: String,
      enum: ["FREE", "PAID"],
      default: "PAID"
    },
    date: {
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
    thumbnail: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    
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
    languages: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Language',
    }],

    noOfTests: {
      type: Number,
      required: true,
    },
    // Add free quota field to handle the edge case where admin deletes tests
    freeQuota: {
      type: Number,
      default: 2,  // Default to first 2 tests free
      min: 0
    },
    tests: [testSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);


// Add a pre-save hook to validate categories and subcategories match the content type
testSeriesSchema.pre('save', async function(next) {
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

// Add a pre-save hook to automatically calculate final prices for validity options
testSeriesSchema.pre('save', function(next) {
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

// Add a pre-save hook to validate test-level noOfQuestions against total section questions
testSeriesSchema.pre('save', function(next) {
  // Validate that total questions in sections don't exceed test's noOfQuestions
  if (this.tests && this.tests.length > 0) {
    this.tests.forEach((test, testIndex) => {
      // Only validate if test has noOfQuestions set
      if (typeof test.noOfQuestions === 'number' && test.noOfQuestions > 0) {
        // Calculate total questions across all sections
        let totalSectionQuestions = 0;
        if (test.sections && test.sections.length > 0) {
          totalSectionQuestions = test.sections.reduce((sum, section) => {
            return sum + (section.questions ? section.questions.length : 0);
          }, 0);
        }
        
        // If total exceeds test limit, throw error
        if (totalSectionQuestions > test.noOfQuestions) {
          const error = new Error(`Test "${test.testName || 'Test-' + (testIndex + 1)}" has ${totalSectionQuestions} questions across all sections, which exceeds the configured noOfQuestions limit of ${test.noOfQuestions}. Please either increase the noOfQuestions limit or remove some questions.`);
          return next(error);
        }
      }
    });
  }
  
  next();
});

// Ensure virtuals are included in toJSON output
testSeriesSchema.set('toJSON', { virtuals: true });
testSeriesSchema.set('toObject', { virtuals: true });

// Export model - explicitly set collection name to 'testseries'
// The third parameter ensures Mongoose uses 'testseries' collection instead of pluralizing 'testSeries'
const TestSeriesModel = mongoose.model('TestSeries', testSeriesSchema, 'testseries');
module.exports = TestSeriesModel;