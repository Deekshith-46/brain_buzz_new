// src/models/CurrentAffairs/LocalCurrentAffair.js
const mongoose = require('mongoose');
const CurrentAffairBase = require('./CurrentAffairBase');

const localSchema = new mongoose.Schema({
  location: {
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
    default: 'LOCAL',
    immutable: true
  }
}, { discriminatorKey: 'affairType' });

module.exports = CurrentAffairBase.discriminator('LocalCurrentAffair', localSchema);