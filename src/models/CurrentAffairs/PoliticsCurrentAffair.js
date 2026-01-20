// src/models/CurrentAffairs/PoliticsCurrentAffair.js
const mongoose = require('mongoose');
const CurrentAffairBase = require('./CurrentAffairBase');

const politicsSchema = new mongoose.Schema({
  politicalParty: {
    type: String,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  caCategory: {
    type: String,
    default: 'POLITICS',
    immutable: true
  }
}, { discriminatorKey: 'affairType' });

module.exports = CurrentAffairBase.discriminator('PoliticsCurrentAffair', politicsSchema);