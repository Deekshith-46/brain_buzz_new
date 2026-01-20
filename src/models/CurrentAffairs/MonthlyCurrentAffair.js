const mongoose = require('mongoose');
const { MONTHS } = require('../../constants/enums');
const CurrentAffair = require('./CurrentAffairBase');

const monthlySchema = new mongoose.Schema({
  month: {
    type: String,
    enum: MONTHS,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  // caCategory is now handled by the discriminator
  caCategory: {
    type: String,
    default: 'MONTHLY',
    immutable: true
  }
}, { 
  discriminatorKey: 'affairType',
  collection: 'currentaffairs' // Must match the base collection
});

// Create discriminator
const MonthlyCurrentAffair = CurrentAffair.discriminator(
  'MonthlyCurrentAffair',
  monthlySchema
);

module.exports = MonthlyCurrentAffair;
