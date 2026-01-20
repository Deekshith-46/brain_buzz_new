const mongoose = require('mongoose');

const CurrentAffairWithCategorySchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CurrentAffairsCategory',
      required: true
    },

    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
      }
    ],

    subCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
        required: true
      }
    ],

    languages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Language',
        required: true
      }
    ],

    name: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      lowercase: true,
      trim: true
    },

    month: {
      type: String,
      enum: [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
      ],
      default: null
    },

    heading: {
      type: String,
      required: true,
      trim: true
    },

    thumbnailUrl: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    fullContent: {
      type: String,
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

CurrentAffairWithCategorySchema.pre('save', async function (next) {
  try {
    const CurrentAffairsCategory = mongoose.model('CurrentAffairsCategory');
    const category = await CurrentAffairsCategory.findById(this.category).lean();

    if (!category) {
      return next(new Error('Invalid Current Affairs category'));
    }

    if (category.categoryType === 'monthly' && !this.month) {
      return next(new Error('Month is required for Monthly Current Affairs'));
    }

    if (category.categoryType !== 'monthly') {
      this.month = null;
    }

    if (this.isModified('name') || this.isNew) {
      this.slug = this.name
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    next();
  } catch (err) {
    next(err);
  }
});

CurrentAffairWithCategorySchema.index(
  { slug: 1, category: 1, month: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  'CurrentAffairWithCategory',
  CurrentAffairWithCategorySchema
);
