const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    siteType: {
      type: String,
      enum: ["FREE", "PAID"],
      required: true,
      unique: true
    },
    
    phone: {
      type: String,
      trim: true
    },
    
    email: {
      type: String,
      trim: true
    },
    
    address: {
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

module.exports = mongoose.model("Contact", contactSchema);