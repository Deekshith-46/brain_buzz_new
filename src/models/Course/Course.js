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
    validities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ValidityOption',
      },
    ],
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPrice: {
      type: Number,
      min: 0,
    },
    discountPercent: {
      type: Number,
      min: 0,
      max: 100,
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