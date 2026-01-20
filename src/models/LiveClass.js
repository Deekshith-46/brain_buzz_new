const mongoose = require('mongoose');

const liveClassSchema = new mongoose.Schema(
  {
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
    description: {
      type: String,
      trim: true,
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    videoLink: {
      type: String,
      required: true,
      trim: true,
    },
    dateTime: {
      type: Date,
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory',
      required: true,
    },
    languageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Language',
      required: true,
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

// Index for efficient querying
liveClassSchema.index({ categoryId: 1, languageId: 1, subCategoryId: 1 });
liveClassSchema.index({ dateTime: 1 });

// Add a pre-save hook to validate categories and subcategories match the content type
liveClassSchema.pre('save', async function(next) {
  // Validate category
  const Category = require('./Course/Category');
  const category = await Category.findById(this.categoryId);
  if (category && category.contentType !== 'LIVE_CLASS') {
    return next(new Error(`Category ${category.name} does not match content type LIVE_CLASS`));
  }
  
  // Validate subcategory
  const SubCategory = require('./Course/SubCategory');
  const subCategory = await SubCategory.findById(this.subCategoryId);
  if (subCategory && subCategory.contentType !== 'LIVE_CLASS') {
    return next(new Error(`SubCategory ${subCategory.name} does not match content type LIVE_CLASS`));
  }
  
  next();
});

module.exports = mongoose.model('LiveClass', liveClassSchema);