const mongoose = require('mongoose');

const currentAffairsCategorySchema = new mongoose.Schema(
  {
    categoryType: {
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

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create unique index for slug
currentAffairsCategorySchema.index(
  { slug: 1 },
  { unique: true }
);

// Pre-save hook to generate slug from categoryType
currentAffairsCategorySchema.pre('save', function (next) {
  if (this.isModified('categoryType') || this.isNew) {
    this.slug = this.categoryType
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

module.exports = mongoose.model('CurrentAffairsCategory', currentAffairsCategorySchema);
