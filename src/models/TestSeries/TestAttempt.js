const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  sectionId: String,
  questionId: String,
  selectedOption: Number, // 0-3 (can be null for cleared responses)
  isCorrect: Boolean,
  timeTaken: Number,  // seconds spent on this question
  markedForReview: { 
    type: Boolean, 
    default: false 
  },
  visited: {
    type: Boolean,
    default: false
  },
  attempted: {
    type: Boolean,
    default: false  // Only true when user selects an option
  }
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

  resultGenerated: { type: Boolean, default: false },
  
  // Embedded test snapshot for performance (avoids frequent TestSeries lookups)
  testSnapshot: {
    testName: String,
    durationInSeconds: Number,
    positiveMarks: Number,
    negativeMarks: Number,
    sections: [{
      _id: String,
      title: String,
      questions: [{
        _id: String,
        questionNumber: Number,
        
        // 🔥 REQUIRED FOR EXAM UI
        questionText: {
          type: String,
          required: true
        },
        
        options: {
          type: [String],
          required: true
        },
        
        // 🔐 Used only after submission
        correctOptionIndex: Number,
        explanation: String,
        
        marks: Number,
        negativeMarks: Number
      }]
    }]
  },
  
  status: { 
    type: String, 
    enum: ['IN_PROGRESS', 'SUBMITTED'], 
    default: 'IN_PROGRESS' 
  },
  
  // Flag to distinguish admin attempts from user attempts
  isAdminAttempt: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Compound unique index to prevent duplicate attempts per user+test
// But allow unlimited attempts for admin (partial filter)
testAttemptSchema.index(
  { user: 1, testSeries: 1, testId: 1 },
  { 
    unique: true,
    partialFilterExpression: { isAdminAttempt: false }
  }
);

module.exports = mongoose.model('TestAttempt', testAttemptSchema);