// src/models/CurrentAffairs/InternationalCurrentAffair.js
const mongoose = require('mongoose');
const CurrentAffairBase = require('./CurrentAffairBase');

const internationalSchema = new mongoose.Schema({
  region: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  caCategory: {
    type: String,
    default: 'INTERNATIONAL',
    immutable: true
  }
}, { discriminatorKey: 'affairType' });

module.exports = CurrentAffairBase.discriminator('InternationalCurrentAffair', internationalSchema);