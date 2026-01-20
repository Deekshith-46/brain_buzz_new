const TestSeries = require('../../models/TestSeries/TestSeries');
const TestAttempt = require('../../models/TestSeries/TestAttempt');
const TestRanking = require('../../models/TestSeries/TestRanking');
const Cutoff = require('../../models/TestSeries/Cutoff');
const User = require('../../models/User/User');

// Helper to determine test state based on timing
const getTestState = (test) => {
  const now = new Date();
  
  // If no timing information, return unknown state
  if (!test.startTime || !test.endTime) {
    return 'unknown';
  }
  
  const startTime = new Date(test.startTime);
  const endTime = new Date(test.endTime);
  const resultPublishTime = test.resultPublishTime ? new Date(test.resultPublishTime) : null;
  
  // Before startTime
  if (now < startTime) {
    return 'upcoming';
  }
  
  // During test
  if (now >= startTime && now <= endTime) {
    return 'live';
  }
  
  // After endTime but before resultPublishTime
  if (resultPublishTime && now > endTime && now < resultPublishTime) {
    return 'result_pending';
  }
  
  // After resultPublishTime or if no resultPublishTime, after endTime
  if (!resultPublishTime || now >= resultPublishTime) {
    return 'results_available';
  }
  
  return 'unknown';
};

// Start Test
exports.startTest = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const userId = req.user._id;

    // Check if user has access to this test series
    const hasAccess = await checkTestSeriesAccess(userId, seriesId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this test series'
      });
    }

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

    // Check test state
    const testState = getTestState(test);
    if (testState !== 'live') {
      return res.status(400).json({
        success: false,
        message: `Test is not available. Current state: ${testState}`
      });
    }

    // Check if user already has an attempt for this test
    const existingAttempt = await TestAttempt.findOne({
      user: userId,
      testSeries: seriesId,
      testId: testId
    });

    if (existingAttempt && existingAttempt.resultGenerated) {
      return res.status(400).json({
        success: false,
        message: 'You have already completed this test'
      });
    }

    // If there's an existing attempt but not completed, return it
    if (existingAttempt) {
      return res.status(200).json({
        success: true,
        message: 'Test attempt resumed',
        data: existingAttempt
      });
    }

    // Create new test attempt
    const testAttempt = new TestAttempt({
      user: userId,
      testSeries: seriesId,
      testId: testId,
      startedAt: new Date(),
      responses: []
    });

    await testAttempt.save();

    return res.status(201).json({
      success: true,
      message: 'Test started successfully',
      data: testAttempt
    });
  } catch (error) {
    console.error('Error starting test:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper to check if user has access to a test series
const checkTestSeriesAccess = async (userId, seriesId) => {
  // This would typically check if the user has purchased the test series
  // For now, we'll just check if the user exists and the series exists
  const user = await User.findById(userId);
  const testSeries = await TestSeries.findById(seriesId);
  
  if (!user || !testSeries) {
    return false;
  }
  
  // Check if the test is free or if user has purchased the series
  // In a real implementation, you would check if the user has purchased the series
  // For now, we'll assume they have access
  return true;
};

// Submit Answer
exports.submitAnswer = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const { sectionId, questionId, selectedOption, timeTaken } = req.body;
    const userId = req.user._id;

    // Find the test attempt
    const testAttempt = await TestAttempt.findOne({
      user: userId,
      testSeries: seriesId,
      testId: testId
    });

    if (!testAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Test attempt not found'
      });
    }

    if (testAttempt.resultGenerated) {
      return res.status(400).json({
        success: false,
        message: 'Test has already been submitted'
      });
    }

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

    // Check test state
    const testState = getTestState(test);
    if (testState !== 'live') {
      return res.status(400).json({
        success: false,
        message: `Test is not available. Current state: ${testState}`
      });
    }

    // Find the section and question
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

    // Check if answer is correct
    const isCorrect = question.correctOptionIndex === selectedOption;

    // Check if this response already exists
    const existingResponseIndex = testAttempt.responses.findIndex(
      r => r.sectionId === sectionId && r.questionId === questionId
    );

    if (existingResponseIndex >= 0) {
      // Update existing response
      testAttempt.responses[existingResponseIndex] = {
        sectionId,
        questionId,
        selectedOption,
        isCorrect,
        timeTaken
      };
    } else {
      // Add new response
      testAttempt.responses.push({
        sectionId,
        questionId,
        selectedOption,
        isCorrect,
        timeTaken
      });
    }

    await testAttempt.save();

    return res.status(200).json({
      success: true,
      message: 'Answer submitted successfully',
      data: {
        isCorrect,
        correctOption: question.correctOptionIndex
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

    // Find the test attempt
    const testAttempt = await TestAttempt.findOne({
      user: userId,
      testSeries: seriesId,
      testId: testId
    });

    if (!testAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Test attempt not found'
      });
    }

    if (testAttempt.resultGenerated) {
      return res.status(400).json({
        success: false,
        message: 'Test has already been submitted'
      });
    }

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

    // Check test state
    const testState = getTestState(test);
    if (testState !== 'live') {
      return res.status(400).json({
        success: false,
        message: `Test is not available. Current state: ${testState}`
      });
    }

    // Calculate results
    const totalQuestions = test.sections.reduce((total, section) => {
      return total + (section.questions ? section.questions.length : 0);
    }, 0);

    const correct = testAttempt.responses.filter(r => r.isCorrect).length;
    const incorrect = testAttempt.responses.filter(r => r.isCorrect === false).length;
    const unattempted = totalQuestions - (correct + incorrect);

    // Calculate score
    let score = 0;
    for (const response of testAttempt.responses) {
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
    const timeTakenMs = testAttempt.submittedAt ? 
      new Date(testAttempt.submittedAt).getTime() - new Date(testAttempt.startedAt).getTime() :
      new Date().getTime() - new Date(testAttempt.startedAt).getTime();
    
    const timeTakenMinutes = timeTakenMs / (1000 * 60);
    const speed = timeTakenMinutes > 0 ? (correct + incorrect) / timeTakenMinutes : 0;

    // Update test attempt with results
    testAttempt.submittedAt = new Date();
    testAttempt.score = score;
    testAttempt.correct = correct;
    testAttempt.incorrect = incorrect;
    testAttempt.unattempted = unattempted;
    testAttempt.accuracy = accuracy;
    testAttempt.speed = speed;
    testAttempt.percentage = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;
    testAttempt.resultGenerated = true;

    await testAttempt.save();

    // Update ranking
    const userRanking = await updateRanking(seriesId, testId, userId, score, accuracy);
    
    // Save the rank in the test attempt
    if (userRanking) {
      testAttempt.rank = userRanking.rank;
      await testAttempt.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Test submitted successfully',
      data: testAttempt
    });
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

    // Recalculate all ranks for this test
    const allRankings = await TestRanking.find({ testId }).sort({ score: -1 });

    // Update ranks
    for (let i = 0; i < allRankings.length; i++) {
      allRankings[i].rank = i + 1;
      allRankings[i].totalParticipants = allRankings.length;
      await allRankings[i].save();
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

    // Check if result publish time has passed
    if (test.resultPublishTime && new Date() < new Date(test.resultPublishTime)) {
      return res.status(400).json({
        success: false,
        message: 'Test result not yet published'
      });
    }

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
    
    // Filter out attempts where result is not yet published
    const filteredAttempts = [];
    
    for (const attempt of attempts) {
      // Find the test series and the specific test
      const testSeries = await TestSeries.findById(attempt.testSeries);
      if (testSeries) {
        const test = testSeries.tests.id(attempt.testId);
        if (test) {
          // Check if result publish time has passed
          if (!test.resultPublishTime || new Date() >= new Date(test.resultPublishTime)) {
            filteredAttempts.push(attempt);
          }
        }
      }
    }
    
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
