const mongoose = require('mongoose');

const cutoffSchema = new mongoose.Schema({
  testSeries: { type: mongoose.Schema.Types.ObjectId, ref: "TestSeries" },
  testId: String,

  cutoff: {
    general: Number,
    sc: Number,
    st: Number,
    obc: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('Cutoff', cutoffSchema);