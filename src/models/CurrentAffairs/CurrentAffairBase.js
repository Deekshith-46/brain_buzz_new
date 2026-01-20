const mongoose = require('mongoose');
const { Schema } = mongoose;

const currentAffairBaseSchema = new Schema(
  {
    contentType: {
      type: String,
      default: 'CURRENT_AFFAIRS',
      immutable: true,
    },
    accessType: {
      type: String,
      enum: ["FREE", "PAID"],
      default: "FREE"
    },
    date: {
      type: Date,
      required: true
    },
    categories: [{
      type: Schema.Types.ObjectId,
      ref: 'Category'
    }],
    subCategories: [{
      type: Schema.Types.ObjectId,
      ref: 'SubCategory'
    }],
    languages: [{
      type: Schema.Types.ObjectId,
      ref: 'Language'
    }],
    thumbnailUrl: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    fullContent: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true,
    discriminatorKey: 'affairType',
    collection: 'currentaffairs' // Explicitly set collection name
  }
);

// Add a pre-save hook to validate categories and subcategories match the content type
currentAffairBaseSchema.pre('save', async function(next) {
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

// Create a model that will be extended by specific types
const CurrentAffair = mongoose.model('CurrentAffair', currentAffairBaseSchema);

module.exports = CurrentAffair;
