const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    pageType: {
      type: String,
      enum: ["HOME", "ABOUT"],
      required: true
    },

    siteType: {
      type: String,
      enum: ["FREE", "PAID"],
      required: true
    },

    images: [
      {
        _id: {
          type: String,
          required: true
        },
        id: {
          type: String,
          required: true
        },
        url: {
          type: String,
          required: true
        }
      }
    ],

    // ABOUT page only (CORRECT STRUCTURE)
    about: {
      images: [
        {
          _id: {
            type: String,
            required: true
          },
          id: {
            type: String,
            required: true
          },
          url: {
            type: String,
            required: true
          }
        }
      ],
      
      primaryTitle: {
        type: String,
        trim: true
      },
      
      primaryDescription: {
        type: String,
        trim: true
      },
      
      secondaryTitle: {
        type: String,
        trim: true
      },
      
      cards: [
        {
          heading: {
            type: String,
            trim: true
          },
          description: {
            type: String,
            trim: true
          }
        }
      ]
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// 🔥 UNIQUE PER PAGE + SITE
bannerSchema.index({ pageType: 1, siteType: 1 }, { unique: true });

module.exports = mongoose.model("Banner", bannerSchema);