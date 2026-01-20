const mongoose = require('mongoose');
const CurrentAffair = require('./CurrentAffairBase');

const latestSchema = new mongoose.Schema({
  heading: {
    type: String,
    required: true,
    trim: true
  },
  // caCategory is now handled by the discriminator
  caCategory: {
    type: String,
    default: 'LATEST',
    immutable: true
  }
}, { 
  discriminatorKey: 'affairType',
  collection: 'currentaffairs' // Must match the base collection
});

// Create discriminator
const LatestCurrentAffair = CurrentAffair.discriminator(
  'LatestCurrentAffair',
  latestSchema
);

module.exports = LatestCurrentAffair;
