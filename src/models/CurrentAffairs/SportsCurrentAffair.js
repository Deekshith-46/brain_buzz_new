const mongoose = require('mongoose');
const CurrentAffair = require('./CurrentAffairBase');

const sportsSchema = new mongoose.Schema({
  sport: {
    type: String,
    required: true,
    trim: true
  },
  event: {
    type: String,
    required: true,
    trim: true
  },
  // caCategory is now handled by the discriminator
  caCategory: {
    type: String,
    default: 'SPORTS',
    immutable: true
  }
}, { 
  discriminatorKey: 'affairType',
  collection: 'currentaffairs' // Must match the base collection
});

// Create discriminator
const SportsCurrentAffair = CurrentAffair.discriminator(
  'SportsCurrentAffair',
  sportsSchema
);

module.exports = SportsCurrentAffair;
