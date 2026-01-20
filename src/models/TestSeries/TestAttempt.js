const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  sectionId: String,
  questionId: String,
  selectedOption: Number, // 0-3
  isCorrect: Boolean,
  timeTaken: Number  // seconds spent on this question
});

const testAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  testSeries: { type: mongoose.Schema.Types.ObjectId, ref: "TestSeries", required: true },
  testId: { type: String, required: true }, // _id of the test inside series

  startedAt: Date,
  submittedAt: Date, // When user submitted the test

  responses: [responseSchema],

  score: Number,
  correct: Number,
  incorrect: Number,
  unattempted: Number,

  accuracy: Number,    // (correct / total_attempt ) * 100
  speed: Number,       // questions answered per minute
  percentage: Number,
  rank: Number,        // User's rank in this test

  resultGenerated: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('TestAttempt', testAttemptSchema);