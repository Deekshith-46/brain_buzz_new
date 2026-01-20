const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    description: {
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

// Create unique index for slug + contentType combination
categorySchema.index(
  { slug: 1, contentType: 1 },
  { unique: true }
);

module.exports = mongoose.model('Category', categorySchema);