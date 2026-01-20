const mongoose = require('mongoose');

const testRankingSchema = new mongoose.Schema({
  testId: String,
  testSeries: { type: mongoose.Schema.Types.ObjectId, ref: "TestSeries" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  score: Number,
  rank: Number,
  accuracy: Number,
  totalParticipants: Number
}, { timestamps: true });

module.exports = mongoose.model('TestRanking', testRankingSchema);