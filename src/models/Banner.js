const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    pageType: {
      type: String,
      enum: ["HOME", "ABOUT"],
      required: true,
      unique: true   // 🔥 VERY IMPORTANT → only one doc per page
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

    // Only for ABOUT page
    heading: {
      type: String,
      trim: true
    },

    description: {
      type: String,
      trim: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Banner", bannerSchema);