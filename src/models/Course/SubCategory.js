const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    contentType: {
      type: String,
      enum: [
        'ONLINE_COURSE',
        'TEST_SERIES',
        'DAILY_QUIZ',
        'LIVE_CLASS',
        'PUBLICATION',
        'E_BOOK',
        'CURRENT_AFFAIRS',
        'PYQ_EBOOK'
      ],
      required: true
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

// Create unique index for slug + category + contentType combination
subCategorySchema.index(
  { slug: 1, category: 1, contentType: 1 },
  { unique: true }
);

module.exports = mongoose.model('SubCategory', subCategorySchema);