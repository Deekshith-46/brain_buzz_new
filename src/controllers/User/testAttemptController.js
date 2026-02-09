const TestSeries = require('../../models/TestSeries/TestSeries');
const TestAttempt = require('../../models/TestSeries/TestAttempt');
const TestRanking = require('../../models/TestSeries/TestRanking');
const Cutoff = require('../../models/TestSeries/Cutoff');
const User = require('../../models/User/User');

// Import dynamic cron manager
const dynamicCronManager = require('../../../utils/dynamicCronManager');

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
          data: {
            attemptId: userAttempt._id,
            startedAt: userAttempt.startedAt,
            status: userAttempt.status
          }
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

    // Calculate total marks for the test
    const totalMarks = test.sections.reduce((total, section) => {
      const sectionTotal = section.questions.reduce((sectionTotal, question) => {
        return sectionTotal + (question.marks || 1);
      }, 0);
      return total + sectionTotal;
    }, 0);

    // Create test snapshot for performance (CBT-compliant - fully self-contained)
    const testSnapshot = {
      testName: test.testName,
      durationInSeconds: test.durationInSeconds || 3600,
      positiveMarks: test.positiveMarks,
      negativeMarks: test.negativeMarks,
      totalMarks: totalMarks,
      sections: test.sections.map(section => ({
        _id: section._id.toString(),
        title: section.title,
        questions: section.questions.map(q => ({
          _id: q._id.toString(),
          questionNumber: q.questionNumber,
          questionText: q.questionText,  // Needed for exam display
          options: q.options,           // Needed for exam display
          correctOptionIndex: q.correctOptionIndex,  // Essential for scoring
          explanation: q.explanation,   // Needed for result analysis
          marks: q.marks,
          negativeMarks: q.negativeMarks
        }))
      }))
    };

    // Create new test attempt atomically
    try {
      const testAttempt = await TestAttempt.create({
        user: userId,
        testSeries: seriesId,
        testId: testId,
        startedAt: new Date(),
        responses: [],
        testSnapshot: testSnapshot,
        status: 'IN_PROGRESS'
      });

      // Start the auto-submit job since a new test has started
      dynamicCronManager.startAutoSubmitJob();

      return res.status(201).json({
        success: true,
        message: 'Test started successfully',
        data: {
          attemptId: testAttempt._id,
          startedAt: testAttempt.startedAt,
          status: testAttempt.status
        }
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
    const { sectionId, questionId, selectedOption, timeTaken, markedForReview } = req.body;
    const userId = req.user._id;

    // VALIDATION PHASE - Do all validation BEFORE any DB updates
    
    // 1. Validate test series and test exist and get question data (using snapshot for performance)
    const testAttempt = await TestAttempt.findOne({
      user: userId,
      testSeries: seriesId,
      testId: testId
    });
    
    if (!testAttempt || !testAttempt.testSnapshot) {
      return res.status(500).json({
        success: false,
        message: 'Test snapshot not found'
      });
    }
    
    const testSnapshot = testAttempt.testSnapshot;
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

    // 2. Find the section and question (using snapshot for correctness calculation)
    let question = null;
    let section = null;
    for (const sec of testSnapshot.sections) {
      const q = sec.questions.find(sq => sq._id === questionId);
      if (q) {
        question = q;
        section = sec;
        break;
      }
    }
    
    // Also get full question data for validation
    let fullQuestion = null;
    for (const sec of test.sections) {
      const q = sec.questions.id(questionId);
      if (q) {
        fullQuestion = q;
        if (!section) section = sec;
        break;
      }
    }

    if (!fullQuestion) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // 3. Validate selected option BEFORE any DB operations
    // Allow null/undefined for clearing response
    if (selectedOption !== null && selectedOption !== undefined) {
      if (selectedOption < 0 || selectedOption >= fullQuestion.options.length) {
        return res.status(400).json({
          success: false,
          message: 'Invalid option selected'
        });
      }
    }

    // 4. Compute correctness using snapshot data (CBT-compliant)
    // Only compute correctness for attempted questions
    const isCorrect = selectedOption !== null && selectedOption !== undefined ? 
      question.correctOptionIndex === selectedOption : null;  // null for unattempted

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
      selectedOption: selectedOption !== undefined ? selectedOption : null,
      isCorrect: isCorrect,  // Store null for unattempted, true/false for attempted
      timeTaken,
      markedForReview: markedForReview || false,
      visited: true,  // Mark as visited when user interacts
      attempted: selectedOption !== null && selectedOption !== undefined  // Only attempted if option selected
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
            'responses.$[elem].selectedOption': selectedOption !== undefined ? selectedOption : null,
            'responses.$[elem].isCorrect': isCorrect,  // Store null for unattempted
            'responses.$[elem].timeTaken': timeTaken,
            'responses.$[elem].markedForReview': markedForReview || false,
            'responses.$[elem].visited': true,
            'responses.$[elem].attempted': selectedOption !== null && selectedOption !== undefined
          }
        },
        {
          arrayFilters: [{ 'elem.questionId': questionId }],
          new: true
        }
      );
    }

    // All validation completed above - proceed with atomic update
    
    // Security: Do NOT return correctness in response to prevent cheating
    return res.status(200).json({
      success: true,
      message: 'Answer submitted successfully'
      // isCorrect is only revealed in result analysis after submission
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

    // Calculate results (CBT-compliant - only attempted questions count)
    const totalQuestions = test.sections.reduce((total, section) => {
      return total + (section.questions ? section.questions.length : 0);
    }, 0);

    const attemptedResponses = finalTestAttempt.responses.filter(r => r.attempted);
    const correct = attemptedResponses.filter(r => r.isCorrect).length;
    const incorrect = attemptedResponses.filter(r => !r.isCorrect).length;
    const unattempted = totalQuestions - attemptedResponses.length;

    // Calculate score (CBT-compliant - only attempted questions scored)
    let score = 0;
    for (const response of finalTestAttempt.responses) {
      // Only score attempted questions
      if (!response.attempted) continue;
      
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

    // Calculate accuracy (CBT-compliant - only attempted questions)
    const accuracy = attemptedResponses.length > 0 ? (correct / attemptedResponses.length) * 100 : 0;

    // Calculate time taken and speed (CBT-standard: attempted questions per minute)
    const timeTakenMs = finalTestAttempt.submittedAt ? 
      new Date(finalTestAttempt.submittedAt).getTime() - new Date(finalTestAttempt.startedAt).getTime() :
      new Date().getTime() - new Date(finalTestAttempt.startedAt).getTime();
    
    const timeTakenMinutes = timeTakenMs / (1000 * 60);
    const speed = timeTakenMinutes > 0 ? attemptedResponses.length / timeTakenMinutes : 0;

    // Update test attempt with calculated results (don't overwrite atomic fields)
    finalTestAttempt.score = score;
    finalTestAttempt.correct = correct;
    finalTestAttempt.incorrect = incorrect;
    finalTestAttempt.unattempted = unattempted;
    finalTestAttempt.accuracy = accuracy;
    finalTestAttempt.speed = speed;
    finalTestAttempt.percentage = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;  // Based on total questions, not attempted
    // submittedAt and resultGenerated already set by atomic update

    await finalTestAttempt.save();

    // Return minimal response (CBT security: no internal data exposed)
    const response = res.status(200).json({
      success: true,
      message: 'Test submitted successfully',
      data: {
        attemptId: finalTestAttempt._id,
        score: finalTestAttempt.score,
        status: finalTestAttempt.status
      }
    });

    // Stop the auto-submit job since this test is now submitted/completed
    dynamicCronManager.stopAutoSubmitJob();

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
}

// Helper function to calculate maximum possible score from snapshot
const calculateMaxScore = (testSnapshot) => {
  if (!testSnapshot.sections) return 0;
  
  let maxScore = 0;
  for (const section of testSnapshot.sections) {
    if (section.questions) {
      for (const question of section.questions) {
        maxScore += question.marks || 1; // Default to 1 mark if not specified
      }
    }
  }
  return maxScore;
};

// Helper function for auto-submit on time expiry
const autoSubmitOnTimeExpiry = async (attemptId, seriesId, testId) => {
  try {
    // Check if attempt still needs submission
    const testAttempt = await TestAttempt.findById(attemptId);
    if (!testAttempt || testAttempt.resultGenerated || testAttempt.status !== 'IN_PROGRESS') {
      return;
    }

    // Atomically submit the test
    const updatedAttempt = await TestAttempt.findOneAndUpdate(
      {
        _id: attemptId,
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

    if (!updatedAttempt) {
      return; // Already submitted by another process
    }

    // Calculate results (using snapshot for performance)
    const testSnapshot = updatedAttempt.testSnapshot;
    if (!testSnapshot) {
      throw new Error('Test snapshot not found for auto-submit');
    }
    
    const totalQuestions = testSnapshot.sections.reduce((total, section) => {
      return total + (section.questions ? section.questions.length : 0);
    }, 0);

    // CBT-compliant scoring: Only count attempted questions
    const attemptedResponses = updatedAttempt.responses.filter(r => r.attempted);
    const correct = attemptedResponses.filter(r => r.isCorrect).length;
    const incorrect = attemptedResponses.filter(r => !r.isCorrect).length;
    const unattempted = totalQuestions - attemptedResponses.length;

    // Calculate score (CBT-compliant - only attempted questions scored)
    let score = 0;
    for (const response of updatedAttempt.responses) {
      // Only score attempted questions
      if (!response.attempted) continue;
      
      let question = null;
      for (const section of testSnapshot.sections) {
        const q = section.questions.find(sq => sq._id === response.questionId);
        if (q) {
          question = q;
          break;
        }
      }

      if (question) {
        if (response.isCorrect) {
          score += question.marks || testSnapshot.positiveMarks || 1;
        } else {
          score -= Math.abs(question.negativeMarks || testSnapshot.negativeMarks || 0);
        }
      }
    }

    const accuracy = attemptedResponses.length > 0 ? (correct / attemptedResponses.length) * 100 : 0;
    
    const timeTakenMs = updatedAttempt.submittedAt ? 
      new Date(updatedAttempt.submittedAt).getTime() - new Date(updatedAttempt.startedAt).getTime() :
      new Date().getTime() - new Date(updatedAttempt.startedAt).getTime();
    
    const timeTakenMinutes = timeTakenMs / (1000 * 60);
    const speed = timeTakenMinutes > 0 ? attemptedResponses.length / timeTakenMinutes : 0;

    // Update attempt with calculated results
    updatedAttempt.score = score;
    updatedAttempt.correct = correct;
    updatedAttempt.incorrect = incorrect;
    updatedAttempt.unattempted = unattempted;
    updatedAttempt.accuracy = accuracy;
    updatedAttempt.speed = speed;
    updatedAttempt.percentage = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;

    await updatedAttempt.save();

    // Update ranking asynchronously
    setImmediate(async () => {
      try {
        await updateRanking(seriesId, testId, updatedAttempt.user, score, accuracy);
      } catch (error) {
        console.error('Error updating ranking in auto-submit:', error);
      }
    });

    // Stop the auto-submit job since this test is now auto-submitted
    dynamicCronManager.stopAutoSubmitJob();

    console.log(`Auto-submitted test attempt ${attemptId} due to time expiry`);
  } catch (error) {
    console.error('Error in auto-submit on time expiry:', error);
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

    // Use snapshot for immutable results (CBT rule: results must not change)
    const testSnapshot = testAttempt.testSnapshot;
    if (!testSnapshot) {
      return res.status(500).json({
        success: false,
        message: 'Test snapshot not found - results cannot be generated'
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

    // Get cutoff from live data (metadata, not result content)
    const cutoff = await Cutoff.findOne({ testId: testAttempt.testId });

    // Section-wise analysis (CBT-compliant - only attempted questions)
    const sectionAnalysis = [];
    const sectionAccuracy = {};

    for (const section of testSnapshot.sections) {
      const sectionResponses = testAttempt.responses.filter(
        r => r.sectionId === section._id.toString()
      );
      
      // Only count attempted responses for scoring
      const attempted = sectionResponses.filter(r => r.attempted);
      const sectionCorrect = attempted.filter(r => r.isCorrect).length;
      const sectionIncorrect = attempted.filter(r => !r.isCorrect).length;
      const sectionTotal = section.questions ? section.questions.length : 0;
      const sectionUnattempted = sectionTotal - attempted.length;
      const sectionAccuracyVal = attempted.length > 0 ? 
        (sectionCorrect / attempted.length) * 100 : 0;

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

    // Find strongest and weakest sections (industry-standard logic)
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
    
    // Handle edge case: all sections have equal accuracy
    const accuracyValues = Object.values(sectionAccuracy);
    if (accuracyValues.length > 1 && accuracyValues.every(a => a === maxAccuracy)) {
      strongestArea = 'All Sections';
      weakestArea = 'None';
    }

    // Question-wise report (using immutable snapshot)
    const questionReports = [];
    for (const response of testAttempt.responses) {
      // Find the section and question from snapshot
      let question = null;
      let section = null;
      for (const sec of testSnapshot.sections) {
        const q = sec.questions.id(response.questionId);
        if (q) {
          question = q;
          section = sec;
          break;
        }
      }

      if (question) {
        // CBT-compliant status logic
        let status;
        if (!response.attempted) {
          status = 'Unattempted';
        } else if (response.isCorrect) {
          status = 'Correct';
        } else {
          status = 'Incorrect';
        }
        
        questionReports.push({
          questionText: question.questionText,
          userAnswer: response.selectedOption,
          correctAnswer: question.correctOptionIndex,
          status: status,
          explanation: question.explanation,
          section: section ? section.title : 'Unknown'
        });
      }
    }

    // Cutoff analysis (clean, deterministic)
    let cutoffStatus = 'Not Available';
    let userCategory = 'UNKNOWN';
    let categoryCutoff = 0;
    
    if (cutoff && testAttempt.user.category) {
      userCategory = testAttempt.user.category;
      const categoryKey = userCategory.toLowerCase();
      
      switch(categoryKey) {
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
        testName: testSnapshot.testName,
        testSeriesName: testAttempt.testSeries.name,
        score: testAttempt.score,
        maxScore: testSnapshot.totalMarks,
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
        userCategory: userCategory,
        cutoff: categoryCutoff,
        score: testAttempt.score,
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

// Get Live Questions for Active Attempt (Exam Mode)
exports.getLiveQuestions = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user._id;

    // Find the test attempt
    const testAttempt = await TestAttempt.findById(attemptId)
      ;

    if (!testAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Test attempt not found'
      });
    }

    // Check if user owns this attempt
    if (testAttempt.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this attempt'
      });
    }

    // Check if test is still in progress
    if (testAttempt.status !== 'IN_PROGRESS' || testAttempt.resultGenerated) {
      return res.status(400).json({
        success: false,
        message: 'Test is no longer active'
      });
    }

    // Use embedded test snapshot for performance (avoids TestSeries lookup)
    const testSnapshot = testAttempt.testSnapshot;
    console.log('DEBUG: testSnapshot sections:', JSON.stringify(testSnapshot.sections[0].questions[0], null, 2));
    if (!testSnapshot) {
      return res.status(500).json({
        success: false,
        message: 'Test snapshot not found'
      });
    }

    // Calculate remaining time (CBT-compliant)
    const now = new Date();
    const startTime = new Date(testAttempt.startedAt);
    const timeElapsed = (now.getTime() - startTime.getTime()) / 1000;
    const remainingTime = Math.max(0, Math.floor(testSnapshot.durationInSeconds - timeElapsed));

    // Auto-submit if time expired
    if (remainingTime === 0 && testAttempt.status === 'IN_PROGRESS' && !testAttempt.resultGenerated) {
      setImmediate(async () => {
        try {
          await autoSubmitOnTimeExpiry(testAttempt._id, testAttempt.testSeries, testAttempt.testId);
        } catch (error) {
          console.error('Error in auto-submit:', error);
        }
      });
    }

    // Build response structure matching Figma design (using snapshot)
    const sections = testSnapshot.sections.map(section => {
      const questions = section.questions.map(question => {
        // Find existing response for this question
        const existingResponse = testAttempt.responses.find(
          r => r.questionId === question._id.toString()
        );

        // Determine question status based on response (CBT-compliant - read-only)
        let status = 'UNVISITED';
        if (existingResponse) {
          if (existingResponse.selectedOption !== null && existingResponse.markedForReview) {
            status = 'ANSWERED_MARKED';
          } else if (existingResponse.selectedOption !== null) {
            status = 'ANSWERED';
          } else if (existingResponse.markedForReview) {
            status = 'MARKED';
          } else if (existingResponse.visited) {
            status = 'UNANSWERED';  // Visited but no answer/mark
          }
        }

        return {
          questionId: question._id.toString(),
          questionNumber: question.questionNumber,
          questionText: question.questionText,
          options: question.options,
          status: status,
          selectedOption: existingResponse ? existingResponse.selectedOption : null,
          markedForReview: existingResponse ? existingResponse.markedForReview : false
        };
      });

      return {
        sectionId: section._id.toString(),
        title: section.title,
        questions: questions
      };
    });

    // Calculate palette statistics (CBT-compliant)
    const allQuestions = sections.flatMap(s => s.questions);
    const palette = {
      ANSWERED: allQuestions.filter(q => q.status === 'ANSWERED').length,
      ANSWERED_MARKED: allQuestions.filter(q => q.status === 'ANSWERED_MARKED').length,
      UNANSWERED: allQuestions.filter(q => q.status === 'UNANSWERED').length,
      MARKED: allQuestions.filter(q => q.status === 'MARKED').length,
      UNVISITED: allQuestions.filter(q => q.status === 'UNVISITED').length
    };

    return res.status(200).json({
      success: true,
      data: {
        remainingTime: remainingTime,
        sections: sections,
        palette: palette,
        testInfo: {
          testName: testSnapshot.testName,
          totalQuestions: allQuestions.length,
          startedAt: testAttempt.startedAt
        }
      }
    });
  } catch (error) {
    console.error('Error getting live questions:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Mark Question as Visited (Navigation tracking)
exports.markQuestionVisited = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const { sectionId, questionId } = req.body;
    const userId = req.user._id;

    // VALIDATION PHASE
    
    // Find the test series and test
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

    // Find the section and question
    const section = test.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    const question = section.questions.id(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check user access
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
        message: `Test cannot be accessed. Current state: ${testState}`
      });
    }

    // Check existing attempt
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

    // Extra guard: prevent marking after submission
    if (existingAttempt.status !== 'IN_PROGRESS' || existingAttempt.resultGenerated) {
      return res.status(400).json({
        success: false,
        message: 'Test already submitted'
      });
    }

    // Use atomic update to mark question as visited
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
        $push: { 
          responses: {
            sectionId: sectionId,
            questionId: questionId,
            selectedOption: null,
            isCorrect: null,  // Visited does not mean incorrect
            timeTaken: 0,
            markedForReview: false,
            visited: true,
            attempted: false  // Navigation does not constitute an attempt
          }
        }
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
            'responses.$[elem].visited': true
          }
        },
        {
          arrayFilters: [{ 'elem.questionId': questionId }],
          new: true
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Question marked as visited'
    });
  } catch (error) {
    console.error('Error marking question as visited:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get Question Paper (Lightweight view for exam mode)
exports.getQuestionPaper = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { sectionId } = req.query;
    const userId = req.user._id;

    // Find the test attempt
    const testAttempt = await TestAttempt.findById(attemptId)
      ;

    if (!testAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Test attempt not found'
      });
    }

    // Check ownership
    if (testAttempt.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this attempt'
      });
    }

    // Find the test
    const testSeries = await TestSeries.findById(testAttempt.testSeries._id);
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

    let questions = [];
    
    if (sectionId) {
      // Get questions from specific section
      const section = test.sections.id(sectionId);
      if (!section) {
        return res.status(404).json({
          success: false,
          message: 'Section not found'
        });
      }
      questions = section.questions.map(q => ({
        questionId: q._id.toString(),
        questionNumber: q.questionNumber,
        questionText: q.questionText.substring(0, 100) + '...' // Truncated for paper view
      }));
    } else {
      // Get all questions
      questions = test.sections.flatMap(section => 
        section.questions.map(q => ({
          questionId: q._id.toString(),
          questionNumber: q.questionNumber,
          sectionTitle: section.title
        }))
      );
    }

    return res.status(200).json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error('Error getting question paper:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

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
