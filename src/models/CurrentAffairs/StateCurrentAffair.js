const mongoose = require('mongoose');
const CurrentAffair = require('./CurrentAffairBase');

const stateSchema = new mongoose.Schema({
  state: {
    type: String,
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
    default: 'STATE',
    immutable: true
  }
}, { 
  discriminatorKey: 'affairType',
  collection: 'currentaffairs' // Must match the base collection
});

// Create discriminator
const StateCurrentAffair = CurrentAffair.discriminator(
  'StateCurrentAffair',
  stateSchema
);

module.exports = StateCurrentAffair;
