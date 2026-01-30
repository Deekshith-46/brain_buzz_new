const TestSeries = require('../../models/TestSeries/TestSeries');
const TestAttempt = require('../../models/TestSeries/TestAttempt');
const TestRanking = require('../../models/TestSeries/TestRanking');
const Cutoff = require('../../models/TestSeries/Cutoff');
const User = require('../../models/User/User');

// Import TestSeriesAccessService
const TestSeriesAccessService = require('../../../services/testSeriesAccessService');

// Helper to determine test state based on timing
const getTestState = (test) => {
  const now = new Date();
  
  // If no timing information, return unknown state
  if (!test.startTime || !test.endTime) {
    return 'unknown';
  }
  
  const startTime = new Date(test.startTime);
  const endTime = new Date(test.endTime);
  
  // Before startTime
  if (now < startTime) {
    return 'upcoming';
  }
  
  // During test
  if (now >= startTime && now <= endTime) {
    return 'live';
  }
  
  // After endTime - results available immediately
  if (now > endTime) {
    return 'results_available';
  }
  
  return 'unknown';
};

// Start Test
exports.startTest = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const userId = req.user._id;

    // Find the test series and the specific test
    const testSeries = await TestSeries.findById(seriesId);
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    const test = testSeries.tests.id(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found in this series'
      });
    }

    // Check if user already has an attempt for this test (active or completed)
    // The unique index will prevent duplicate attempts at DB level
    const userAttempt = await TestAttempt.findOne({
      user: userId,
      testSeries: seriesId,
      testId: testId
    });

    if (userAttempt) {
      if (userAttempt.status === 'IN_PROGRESS' && !userAttempt.resultGenerated) {
        return res.status(200).json({
          success: true,
          message: 'Test attempt resumed',
          data: userAttempt
        });
      }
      
      if (userAttempt.resultGenerated || userAttempt.status === 'SUBMITTED') {
        return res.status(400).json({
          success: false,
          message: 'You have already completed this test'
        });
      }
    }

    // Determine if test is free based on freeQuota
    const testIndex = testSeries.tests.findIndex(t => t._id.toString() === testId);
    const isTestFree = testIndex < (testSeries.freeQuota || 2);

    // Check if user has access to this test series
    let hasAccess = false;
    if (isTestFree) {
      hasAccess = true; // Free test based on quota
    } else {
      hasAccess = await TestSeriesAccessService.hasTestAccess(userId, seriesId, testId);
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this test series'
      });
    }

    // Check test state - only allow starting live tests
    const testState = getTestState(test);
    if (testState !== 'live') {
      return res.status(400).json({
        success: false,
        message: `Test is not available. Current state: ${testState}`
      });
    }

    // All attempt checking is already done above with userAttempt
    // If we reach here, userAttempt is null (no existing attempt)
    // So we can safely create a new attempt

    // Create new test attempt atomically
    try {
      const testAttempt = await TestAttempt.create({
        user: userId,
        testSeries: seriesId,
        testId: testId,
        startedAt: new Date(),
        responses: [],
        status: 'IN_PROGRESS'
      });

      return res.status(201).json({
        success: true,
        message: 'Test started successfully',
        data: testAttempt
      });
    } catch (error) {
      // Handle duplicate key error (11000)
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Test already started'
        });
      }
      
      // Re-throw other errors
      throw error;
    }
  } catch (error) {
    console.error('Error starting test:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

// Submit Answer
exports.submitAnswer = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const { sectionId, questionId, selectedOption, timeTaken } = req.body;
    const userId = req.user._id;

    // VALIDATION PHASE - Do all validation BEFORE any DB updates
    
    // 1. Validate test series and test exist and get question data
    const testSeries = await TestSeries.findById(seriesId);
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    const test = testSeries.tests.id(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found in this series'
      });
    }

    // 2. Find the section and question
    let question = null;
    let section = null;
    for (const sec of test.sections) {
      const q = sec.questions.id(questionId);
      if (q) {
        question = q;
        section = sec;
        break;
      }
    }

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // 3. Validate selected option BEFORE any DB operations
    if (selectedOption < 0 || selectedOption >= question.options.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid option selected'
      });
    }

    // 4. Compute correctness BEFORE any DB operations
    const isCorrect = question.correctOptionIndex === selectedOption;

    // 5. Validate user access
    const testIndex = testSeries.tests.findIndex(t => t._id.toString() === testId);
    const isTestFree = testIndex < (testSeries.freeQuota || 2);
    
    let hasAccess = false;
    if (isTestFree) {
      hasAccess = true;
    } else {
      hasAccess = await TestSeriesAccessService.hasTestAccess(userId, seriesId, testId);
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this test series'
      });
    }

    // 6. Validate test state
    const testState = getTestState(test);
    if (!['live', 'results_available'].includes(testState)) {
      return res.status(400).json({
        success: false,
        message: `Test cannot be submitted. Current state: ${testState}`
      });
    }

    // 7. Validate test attempt exists and is active
    const existingAttempt = await TestAttempt.findOne({
      user: userId,
      testSeries: seriesId,
      testId: testId
    });

    if (!existingAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Test attempt not found'
      });
    }

    // Extra guard: prevent answering after submission
    if (existingAttempt.status !== 'IN_PROGRESS' || existingAttempt.resultGenerated) {
      return res.status(400).json({
        success: false,
        message: 'Test already submitted'
      });
    }

    // Create the response object with validated data
    const newResponse = {
      sectionId,
      questionId,
      selectedOption,
      isCorrect,
      timeTaken
    };

    // Use atomic update to handle response submission
    const updatedAttempt = await TestAttempt.findOneAndUpdate(
      {
        user: userId,
        testSeries: seriesId,
        testId: testId,
        resultGenerated: { $ne: true },
        status: 'IN_PROGRESS',
        'responses.questionId': { $ne: questionId } // Response doesn't exist yet
      },
      {
        $push: { responses: newResponse }
      },
      { new: true }
    );

    // If the first update didn't work (response already exists), update existing
    if (!updatedAttempt) {
      await TestAttempt.updateOne(
        {
          user: userId,
          testSeries: seriesId,
          testId: testId,
          resultGenerated: { $ne: true },
          status: 'IN_PROGRESS',
          'responses.questionId': questionId
        },
        {
          $set: { 
            'responses.$[elem].selectedOption': selectedOption,
            'responses.$[elem].isCorrect': isCorrect,
            'responses.$[elem].timeTaken': timeTaken
          }
        },
        {
          arrayFilters: [{ 'elem.questionId': questionId }],
          new: true
        }
      );
    }

    // All validation completed above - proceed with atomic update

    return res.status(200).json({
      success: true,
      message: 'Answer submitted successfully',
      data: {
        isCorrect
        // NOTE: Do NOT return correctOption immediately to prevent cheating
      }
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Submit Test (Finish Test)
exports.submitTest = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const userId = req.user._id;

    // STEP 1: Lock the attempt (find without modifying)
    const testAttempt = await TestAttempt.findOne({
      user: userId,
      testSeries: seriesId,
      testId: testId,
      resultGenerated: { $ne: true },
      status: 'IN_PROGRESS'
    });

    if (!testAttempt) {
      // Check if test was already submitted
      const submittedAttempt = await TestAttempt.findOne({
        user: userId,
        testSeries: seriesId,
        testId: testId,
        resultGenerated: true
      });
      
      if (submittedAttempt) {
        return res.status(400).json({
          success: false,
          message: 'Test has already been submitted'
        });
      }
      
      return res.status(404).json({
        success: false,
        message: 'Test attempt not found or already submitted'
      });
    }

    // STEP 2: Perform all validations BEFORE state change
    
    // Find the test series and the specific test
    const testSeries = await TestSeries.findById(seriesId);
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    const test = testSeries.tests.id(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found in this series'
      });
    }

    // Check access
    const testIndex = testSeries.tests.findIndex(t => t._id.toString() === testId);
    const isTestFree = testIndex < (testSeries.freeQuota || 2);
    
    let hasAccess = false;
    if (isTestFree) {
      hasAccess = true;
    } else {
      hasAccess = await TestSeriesAccessService.hasTestAccess(userId, seriesId, testId);
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this test series'
      });
    }

    // Check test state
    const testState = getTestState(test);
    if (!['live', 'results_available'].includes(testState)) {
      return res.status(400).json({
        success: false,
        message: `Test cannot be submitted. Current state: ${testState}`
      });
    }

    // STEP 3: Atomically submit the test AFTER all validations pass
    const updatedAttempt = await TestAttempt.findOneAndUpdate(
      {
        _id: testAttempt._id,
        user: userId,
        testSeries: seriesId,
        testId: testId,
        resultGenerated: { $ne: true },
        status: 'IN_PROGRESS'
      },
      { 
        $set: { 
          resultGenerated: true, 
          submittedAt: new Date(),
          status: 'SUBMITTED'
        }
      },
      { new: true }
    );

    // If update failed, someone else submitted it
    if (!updatedAttempt) {
      return res.status(400).json({
        success: false,
        message: 'Test submission failed - attempt may have been submitted by another request'
      });
    }

    // Use the updated attempt for scoring
    const finalTestAttempt = updatedAttempt;

    // All validations completed above

    // Calculate results
    const totalQuestions = test.sections.reduce((total, section) => {
      return total + (section.questions ? section.questions.length : 0);
    }, 0);

    const correct = finalTestAttempt.responses.filter(r => r.isCorrect).length;
    const incorrect = finalTestAttempt.responses.filter(r => r.isCorrect === false).length;
    const unattempted = totalQuestions - (correct + incorrect);

    // Calculate score
    let score = 0;
    for (const response of finalTestAttempt.responses) {
      // Find the question to get its marks
      let question = null;
      for (const section of test.sections) {
        const q = section.questions.id(response.questionId);
        if (q) {
          question = q;
          break;
        }
      }

      if (question) {
        if (response.isCorrect) {
          score += question.marks || test.positiveMarks || 1;
        } else {
          score -= Math.abs(question.negativeMarks || test.negativeMarks || 0);
        }
      }
    }

    // Calculate accuracy
    const accuracy = correct + incorrect > 0 ? (correct / (correct + incorrect)) * 100 : 0;

    // Calculate time taken and speed
    const timeTakenMs = finalTestAttempt.submittedAt ? 
      new Date(finalTestAttempt.submittedAt).getTime() - new Date(finalTestAttempt.startedAt).getTime() :
      new Date().getTime() - new Date(finalTestAttempt.startedAt).getTime();
    
    const timeTakenMinutes = timeTakenMs / (1000 * 60);
    const speed = timeTakenMinutes > 0 ? (correct + incorrect) / timeTakenMinutes : 0;

    // Update test attempt with calculated results (don't overwrite atomic fields)
    finalTestAttempt.score = score;
    finalTestAttempt.correct = correct;
    finalTestAttempt.incorrect = incorrect;
    finalTestAttempt.unattempted = unattempted;
    finalTestAttempt.accuracy = accuracy;
    finalTestAttempt.speed = speed;
    finalTestAttempt.percentage = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;
    // submittedAt and resultGenerated already set by atomic update

    await finalTestAttempt.save();

    // Return response immediately for better UX
    const response = res.status(200).json({
      success: true,
      message: 'Test submitted successfully',
      data: finalTestAttempt
    });

    // Update ranking asynchronously to improve performance
    setImmediate(async () => {
      try {
        await updateRanking(seriesId, testId, userId, score, accuracy);
      } catch (error) {
        console.error('Error updating ranking:', error);
        // Don't fail the main submission if ranking fails
      }
    });

    return response;
  } catch (error) {
    console.error('Error submitting test:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper function to update ranking
const updateRanking = async (seriesId, testId, userId, score, accuracy) => {
  try {
    // Save or update user's ranking
    await TestRanking.findOneAndUpdate(
      { testId, user: userId },
      { 
        testSeries: seriesId,
        score,
        accuracy,
        rank: 0 // Will be updated when recalculating
      },
      { upsert: true, new: true }
    );

    // Get all rankings for this test sorted by score (descending), then accuracy, then submission time
    const allRankings = await TestRanking.find({ testId })
      .sort({ score: -1, accuracy: -1, createdAt: 1 });

    // Calculate ranks in memory to reduce database operations
    const updates = allRankings.map((ranking, index) => ({
      updateOne: {
        filter: { _id: ranking._id },
        update: { 
          $set: { 
            rank: index + 1,
            totalParticipants: allRankings.length
          }
        }
      }
    }));

    // Execute all updates in a single bulk operation
    if (updates.length > 0) {
      await TestRanking.bulkWrite(updates);
    }
    
    // Return the user's ranking
    const userRanking = await TestRanking.findOne({ testId, user: userId });
    return userRanking;
  } catch (error) {
    console.error('Error updating ranking:', error);
    return null;
  }
};

// Get Full Result Analysis
exports.getResultAnalysis = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user._id;

    // Find the test attempt
    const testAttempt = await TestAttempt.findById(attemptId)
      .populate('user', 'name email category')
      .populate('testSeries', 'name');

    if (!testAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Test attempt not found'
      });
    }

    // Check if user owns this attempt
    if (testAttempt.user._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this result'
      });
    }

    // Find the test series and the specific test
    const testSeries = await TestSeries.findById(testAttempt.testSeries);
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    const test = testSeries.tests.id(testAttempt.testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found in this series'
      });
    }

    // Check if result is generated
    if (!testAttempt.resultGenerated) {
      return res.status(400).json({
        success: false,
        message: 'Test result not yet generated'
      });
    }

    // With simplified state logic, results are available immediately after submission
    // No additional checks needed for result publish time

    // Get user ranking
    const userRanking = await TestRanking.findOne({
      testId: testAttempt.testId,
      user: userId
    });

    // Get cutoff if exists
    const cutoff = await Cutoff.findOne({ testId: testAttempt.testId });

    // Section-wise analysis
    const sectionAnalysis = [];
    const sectionAccuracy = {};

    for (const section of test.sections) {
      const sectionResponses = testAttempt.responses.filter(
        r => r.sectionId === section._id.toString()
      );

      const sectionCorrect = sectionResponses.filter(r => r.isCorrect).length;
      const sectionIncorrect = sectionResponses.filter(r => r.isCorrect === false).length;
      const sectionTotal = section.questions ? section.questions.length : 0;
      const sectionUnattempted = sectionTotal - (sectionCorrect + sectionIncorrect);
      const sectionAccuracyVal = sectionCorrect + sectionIncorrect > 0 ? 
        (sectionCorrect / (sectionCorrect + sectionIncorrect)) * 100 : 0;

      sectionAccuracy[section.title] = sectionAccuracyVal;

      sectionAnalysis.push({
        sectionName: section.title,
        correct: sectionCorrect,
        incorrect: sectionIncorrect,
        unattempted: sectionUnattempted,
        accuracy: sectionAccuracyVal,
        total: sectionTotal
      });
    }

    // Find strongest and weakest sections
    let strongestArea = '';
    let weakestArea = '';
    let maxAccuracy = -1;
    let minAccuracy = 101;

    for (const [sectionName, accuracy] of Object.entries(sectionAccuracy)) {
      if (accuracy > maxAccuracy) {
        maxAccuracy = accuracy;
        strongestArea = sectionName;
      }
      if (accuracy < minAccuracy) {
        minAccuracy = accuracy;
        weakestArea = sectionName;
      }
    }

    // Question-wise report
    const questionReports = [];
    for (const response of testAttempt.responses) {
      // Find the section and question
      let question = null;
      let section = null;
      for (const sec of test.sections) {
        const q = sec.questions.id(response.questionId);
        if (q) {
          question = q;
          section = sec;
          break;
        }
      }

      if (question) {
        questionReports.push({
          questionText: question.questionText,
          userAnswer: response.selectedOption,
          correctAnswer: question.correctOptionIndex,
          status: response.isCorrect ? 'Correct' : 'Incorrect',
          explanation: question.explanation,
          section: section ? section.title : 'Unknown'
        });
      }
    }

    // Cutoff analysis
    let cutoffStatus = 'Not Available';
    if (cutoff && testAttempt.user.category) {
      const userCategory = testAttempt.user.category.toLowerCase();
      let categoryCutoff = 0;
      
      switch(userCategory) {
        case 'gen':
        case 'general':
          categoryCutoff = cutoff.cutoff.general;
          break;
        case 'obc':
          categoryCutoff = cutoff.cutoff.obc;
          break;
        case 'sc':
          categoryCutoff = cutoff.cutoff.sc;
          break;
        case 'st':
          categoryCutoff = cutoff.cutoff.st;
          break;
      }
      
      if (categoryCutoff > 0) {
        cutoffStatus = testAttempt.score >= categoryCutoff ? 'Passed' : 'Failed';
      }
    }

    // Calculate percentile
    let percentile = 0;
    if (userRanking && userRanking.totalParticipants > 1) {
      percentile = ((userRanking.totalParticipants - userRanking.rank) / 
                   (userRanking.totalParticipants - 1)) * 100;
    }

    const result = {
      // User Summary
      userSummary: {
        userName: testAttempt.user.name,
        userEmail: testAttempt.user.email,
        testName: test.testName,
        testSeriesName: testAttempt.testSeries.name,
        score: testAttempt.score,
        correct: testAttempt.correct,
        incorrect: testAttempt.incorrect,
        unattempted: testAttempt.unattempted,
        accuracy: testAttempt.accuracy,
        speed: testAttempt.speed,
        percentage: testAttempt.percentage,
        rank: userRanking ? userRanking.rank : null,
        totalParticipants: userRanking ? userRanking.totalParticipants : null,
        percentile: percentile
      },
      
      // Cutoff Analysis
      cutoffAnalysis: {
        status: cutoffStatus,
        userCategory: testAttempt.user.category,
        cutoffs: cutoff ? cutoff.cutoff : null
      },
      
      // Section-wise Report
      sectionReport: sectionAnalysis,
      
      // Strength/Weakness Areas
      performanceAnalysis: {
        strongestArea: strongestArea,
        weakestArea: weakestArea
      },
      
      // Question-wise Report
      questionReport: questionReports
    };

    return res.status(200).json({
      success: true,
      message: 'Result analysis fetched successfully',
      data: result
    });
  } catch (error) {
    console.error('Error getting result analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get user's test attempts/history
exports.getUserTestAttempts = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all test attempts for this user
    const attempts = await TestAttempt.find({ user: userId })
      .populate('testSeries', 'name')
      .sort({ createdAt: -1 });
    
    // With simplified state logic, all completed attempts are available
    // Since results are available immediately after submission, show all completed attempts
    const filteredAttempts = attempts.filter(attempt => attempt.resultGenerated);
    
    return res.status(200).json({
      success: true,
      data: filteredAttempts
    });
  } catch (error) {
    console.error('Error fetching user test attempts:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

// Get Leaderboard for a specific test
exports.getLeaderboard = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    
    // Find the test series and the specific test to verify they exist
    const testSeries = await TestSeries.findById(seriesId);
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    const test = testSeries.tests.id(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found in this series'
      });
    }

    // Get rankings for this test sorted by rank (single source of truth)
    const rankings = await TestRanking.find({ testId })
      .populate('user', 'name email')
      .sort({ rank: 1 }); // Sort by pre-calculated rank

    // Get total participants count
    const totalParticipants = await TestRanking.countDocuments({ testId });

    // Prepare leaderboard data using rank as position
    const leaderboard = rankings.map((ranking) => ({
      position: ranking.rank,
      user: {
        name: ranking.user?.name,
        email: ranking.user?.email
      },
      score: ranking.score,
      accuracy: ranking.accuracy,
      totalParticipants: totalParticipants
    }));

    return res.status(200).json({
      success: true,
      data: {
        testId,
        testName: test.testName,
        totalParticipants,
        leaderboard
      }
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
