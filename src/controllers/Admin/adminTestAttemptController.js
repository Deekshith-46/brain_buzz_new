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

  if (now < startTime) {
    return 'upcoming';
  } else if (now >= startTime && now <= endTime) {
    return 'live';
  } else {
    return 'expired';
  }
};

/**
 * Admin Start Test - No purchase checks, unlimited attempts
 * POST /api/admin/test-attempts/:seriesId/:testId/start
 */
exports.startTest = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const adminId = req.user._id;

    // Find the test series
    const testSeries = await TestSeries.findById(seriesId);
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    // Find the specific test
    const test = testSeries.tests.id(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    // Check if test is live/expired (timing validation only)
    const testState = getTestState(test);
    if (testState === 'upcoming') {
      return res.status(400).json({
        success: false,
        message: 'Test has not started yet'
      });
    }

    // FOR ADMIN: Skip all purchase/access checks
    // Admin can attempt any test regardless of purchase status

    // FOR ADMIN: Allow unlimited attempts (no duplicate check)

    // Calculate total marks for the test with proper checks
    const totalMarks = test.sections && Array.isArray(test.sections) ? 
      test.sections.reduce((total, section) => {
        const sectionTotal = section.questions && Array.isArray(section.questions) ?
          section.questions.reduce((sectionTotal, question) => {
            return sectionTotal + (question.marks || 1);
          }, 0) : 0;
        return total + sectionTotal;
      }, 0) : 0;

    // Create test snapshot for performance (CBT-compliant - fully self-contained)
    const testSnapshot = {
      testName: test.testName,
      durationInSeconds: test.durationInSeconds || 3600,
      positiveMarks: test.positiveMarks,
      negativeMarks: test.negativeMarks,
      totalMarks: totalMarks,
      sections: test.sections && Array.isArray(test.sections) ? 
        test.sections.map(section => ({
          _id: section._id ? section._id.toString() : '',
          title: section.title || '',
          questions: section.questions && Array.isArray(section.questions) ?
            section.questions.map(q => ({
              _id: q._id ? q._id.toString() : '',
              questionNumber: q.questionNumber,
              questionText: q.questionText,
              options: q.options || [],
              correctOptionIndex: q.correctOptionIndex,
              explanation: q.explanation,
              marks: q.marks,
              negativeMarks: q.negativeMarks
            })) : []
        })) : []
    };

    // Create new attempt with admin flag
    const attempt = await TestAttempt.create({
      user: adminId,
      testSeries: seriesId,
      testId: testId,
      testSnapshot: testSnapshot,
      startedAt: new Date(),
      status: 'IN_PROGRESS',
      isAdminAttempt: true  // Flag for admin attempt
    });

    // Start the auto-submit job since a new test has started
    dynamicCronManager.startAutoSubmitJob();

    return res.status(201).json({
      success: true,
      message: 'Test started successfully',
      data: {
        attemptId: attempt._id,
        testName: test.testName,
        durationInSeconds: test.durationInSeconds || 3600,
        totalMarks: totalMarks,
        startedAt: attempt.startedAt
      }
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

/**
 * Admin Get Live Questions - Admin can see correct answers and explanations
 * GET /api/admin/test-attempts/:attemptId/questions
 */
exports.getLiveQuestions = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const adminId = req.user._id;

    // Find the test attempt (admin can access any of their attempts)
    const testAttempt = await TestAttempt.findOne({
      _id: attemptId,
      user: adminId,
      isAdminAttempt: true
    }).populate('testSeries', 'name');

    if (!testAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Test attempt not found or unauthorized'
      });
    }

    // Use snapshot for immutable questions (CBT rule)
    const testSnapshot = testAttempt.testSnapshot;
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

    // Build response structure matching user API format
    const sections = testSnapshot.sections.map(section => {
      const questions = section.questions.map(question => {
        // Find existing response for this question
        const existingResponse = testAttempt.responses.find(
          r => r.questionId === question._id.toString()
        );

        // Determine question status based on response (CBT-compliant)
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

/**
 * Admin Submit Question
 * POST /api/admin/test-attempts/:seriesId/:testId/submit-question
 */
exports.submitQuestion = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const { questionId, selectedOption, timeTaken = 0, markedForReview = false } = req.body;
    const adminId = req.user._id;

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: 'Question ID is required'
      });
    }

    // Find admin's ongoing attempt
    const existingAttempt = await TestAttempt.findOne({
      user: adminId,
      testSeries: seriesId,
      testId: testId,
      status: 'IN_PROGRESS',
      isAdminAttempt: true
    });

    if (!existingAttempt) {
      return res.status(404).json({
        success: false,
        message: 'No active test attempt found'
      });
    }

    // Use snapshot to validate question
    const testSnapshot = existingAttempt.testSnapshot;
    if (!testSnapshot) {
      return res.status(500).json({
        success: false,
        message: 'Test snapshot not found'
      });
    }

    // Find the question in snapshot
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

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found in test'
      });
    }

    // Validate selected option
    if (selectedOption !== null && selectedOption !== undefined) {
      if (selectedOption < 0 || selectedOption >= question.options.length) {
        return res.status(400).json({
          success: false,
          message: 'Invalid option selected'
        });
      }
    }

    // Update or create response
    const responseIndex = existingAttempt.responses.findIndex(
      r => r.questionId === questionId
    );

    const response = {
      sectionId: section._id.toString(),
      questionId: questionId,
      selectedOption: selectedOption,
      isCorrect: selectedOption === question.correctOptionIndex,
      timeTaken: timeTaken,
      markedForReview: markedForReview,
      visited: true,
      attempted: selectedOption !== null && selectedOption !== undefined
    };

    if (responseIndex >= 0) {
      // Update existing response
      existingAttempt.responses[responseIndex] = response;
    } else {
      // Add new response
      existingAttempt.responses.push(response);
    }

    await existingAttempt.save();

    return res.status(200).json({
      success: true,
      message: 'Answer submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting question:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Admin Visit Question
 * POST /api/admin/test-attempts/:seriesId/:testId/visit-question
 */
exports.visitQuestion = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const { questionId } = req.body;
    const adminId = req.user._id;

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: 'Question ID is required'
      });
    }

    // Find admin's ongoing attempt
    const existingAttempt = await TestAttempt.findOne({
      user: adminId,
      testSeries: seriesId,
      testId: testId,
      status: 'IN_PROGRESS',
      isAdminAttempt: true
    });

    if (!existingAttempt) {
      return res.status(404).json({
        success: false,
        message: 'No active test attempt found'
      });
    }

    // Check if response already exists
    const existingResponse = existingAttempt.responses.find(
      r => r.questionId === questionId
    );

    if (!existingResponse) {
      // Create visited response
      const testSnapshot = existingAttempt.testSnapshot;
      let section = null;
      for (const sec of testSnapshot.sections) {
        const q = sec.questions.id(questionId);
        if (q) {
          section = sec;
          break;
        }
      }

      if (section) {
        existingAttempt.responses.push({
          sectionId: section._id.toString(),
          questionId: questionId,
          selectedOption: null,
          isCorrect: null,
          timeTaken: 0,
          markedForReview: false,
          visited: true,
          attempted: false
        });

        await existingAttempt.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Question marked as visited'
    });

  } catch (error) {
    console.error('Error visiting question:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Admin Submit Test - Skip ranking and cutoff for admin
 * POST /api/admin/test-attempts/:seriesId/:testId/submit
 */
exports.submitTest = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const adminId = req.user._id;

    // Find the ongoing attempt
    const existingAttempt = await TestAttempt.findOne({
      user: adminId,
      testSeries: seriesId,
      testId: testId,
      status: 'IN_PROGRESS',
      isAdminAttempt: true
    });

    if (!existingAttempt) {
      return res.status(404).json({
        success: false,
        message: 'No active test attempt found'
      });
    }

    // Use snapshot for scoring (CBT-compliant - immutable)
    const testSnapshot = existingAttempt.testSnapshot;
    if (!testSnapshot) {
      return res.status(500).json({
        success: false,
        message: 'Test snapshot not found'
      });
    }

    // Calculate total questions
    const totalQuestions = testSnapshot.sections.reduce((total, section) => {
      return total + (section.questions ? section.questions.length : 0);
    }, 0);

    // Calculate scores using snapshot
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    let totalScore = 0;
    let totalTime = 0;

    for (const section of testSnapshot.sections) {
      for (const question of section.questions) {
        const response = existingAttempt.responses.find(
          r => r.questionId === question._id.toString()
        );

        const isAttempted = response && response.attempted;
        const isCorrect = response && response.isCorrect;

        if (!isAttempted) {
          unattempted++;
        } else if (isCorrect) {
          correct++;
          totalScore += question.marks || 1;
        } else {
          incorrect++;
          totalScore -= question.negativeMarks || 0;
        }

        totalTime += response ? response.timeTaken : 0;
      }
    }

    // Update attempt with results
    existingAttempt.status = 'SUBMITTED';
    existingAttempt.submittedAt = new Date();
    existingAttempt.correct = correct;
    existingAttempt.incorrect = incorrect;
    existingAttempt.unattempted = unattempted;
    existingAttempt.score = Math.max(0, totalScore); // No negative scores
    existingAttempt.accuracy = correct + incorrect > 0 ? 
      (correct / (correct + incorrect)) * 100 : 0;
    existingAttempt.percentage = totalQuestions > 0 ? 
      (correct / totalQuestions) * 100 : 0;  // Match user calculation
    existingAttempt.speed = totalTime > 0 ? 
      (correct + incorrect) / (totalTime / 60) : 0; // Questions per minute
    existingAttempt.resultGenerated = true;

    await existingAttempt.save();

    // Stop the auto-submit job since this test is now submitted/completed
    dynamicCronManager.stopAutoSubmitJob();

    // FOR ADMIN: Skip ranking and cutoff evaluation
    // Admin attempts don't affect leaderboard or cutoff calculations

    return res.status(200).json({
      success: true,
      message: 'Test submitted successfully',
      data: {
        attemptId: existingAttempt._id,
        score: existingAttempt.score,
        correct: correct,
        incorrect: incorrect,
        unattempted: unattempted,
        accuracy: existingAttempt.accuracy,
        percentage: existingAttempt.percentage,
        totalTime: totalTime
      }
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

/**
 * Admin Get Result Analysis - No cutoff/rank/percentile for admin
 * GET /api/admin/test-attempts/:attemptId/result
 */
exports.getResultAnalysis = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const adminId = req.user._id;

    // Find the test attempt
    const testAttempt = await TestAttempt.findById(attemptId)
      .populate('user', 'name email')
      .populate('testSeries', 'name');

    if (!testAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Test attempt not found'
      });
    }

    // Check if admin owns this attempt
    // For admin attempts, we don't need to check user ownership since admin can view all their attempts
    if (!testAttempt.isAdminAttempt) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this result'
      });
    }

    // Use snapshot for immutable results
    const testSnapshot = testAttempt.testSnapshot;
    if (!testSnapshot) {
      return res.status(500).json({
        success: false,
        message: 'Test snapshot not found'
      });
    }

    // Check if result is generated
    if (!testAttempt.resultGenerated) {
      return res.status(400).json({
        success: false,
        message: 'Test result not yet generated'
      });
    }

    // Section-wise analysis
    const sectionAnalysis = [];
    const sectionAccuracy = {};

    for (const section of testSnapshot.sections) {
      const sectionResponses = testAttempt.responses.filter(
        r => r.sectionId === section._id.toString()
      );
      
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
    
    // Handle edge case: all sections have equal accuracy
    const accuracyValues = Object.values(sectionAccuracy);
    if (accuracyValues.length > 1 && accuracyValues.every(a => a === maxAccuracy)) {
      strongestArea = 'All Sections';
      weakestArea = 'None';
    }

    // Question-wise report
    const questionReports = [];
    for (const response of testAttempt.responses) {
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
          correctAnswer: question.correctOptionIndex,  // Admin always sees correct answer
          status: status,
          explanation: question.explanation,          // Admin always sees explanation
          section: section ? section.title : 'Unknown'
        });
      }
    }

    // FOR ADMIN: Simplified result (no cutoff, rank, or percentile)
    const result = {
      // User Summary (simplified for admin - no rank/percentile)
      userSummary: {
        userName: testAttempt.user?.name || 'Admin User',
        userEmail: testAttempt.user?.email || 'admin@example.com',
        testName: testSnapshot.testName,
        testSeriesName: testAttempt.testSeries.name,
        score: testAttempt.score,
        maxScore: testSnapshot.totalMarks,
        correct: testAttempt.correct,
        incorrect: testAttempt.incorrect,
        unattempted: testAttempt.unattempted,
        accuracy: testAttempt.accuracy,
        speed: testAttempt.speed,
        percentage: testAttempt.percentage
        // Removed: rank, totalParticipants, percentile (not relevant for admin)
      },
      
      // Section Report
      sectionReport: sectionAnalysis,
      
      // Performance Analysis
      performanceAnalysis: {
        strongestArea: strongestArea,
        weakestArea: weakestArea
      },
      
      // Question-wise Report (with explanations and correct answers)
      questionReport: questionReports
      // Removed: cutoffAnalysis (not relevant for admin)
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

/**
 * Admin Get My Attempts - Unlimited attempts for admin
 * GET /api/admin/test-attempts/my-attempts
 */
exports.getMyAttempts = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { seriesId, testId } = req.query;

    // Build query for admin attempts only
    const query = {
      user: adminId,
      isAdminAttempt: true
    };

    if (seriesId) query.testSeries = seriesId;
    if (testId) query.testId = testId;

    // Get admin's attempts
    const attempts = await TestAttempt.find(query)
      .populate('testSeries', 'name')
      .sort({ createdAt: -1 });

    // Transform for response
    const attemptList = attempts.map(attempt => {
      // Find the test details from snapshot
      const testSnapshot = attempt.testSnapshot;
      const testName = testSnapshot ? testSnapshot.testName : 'Unknown Test';

      return {
        attemptId: attempt._id,
        testName: testName,
        testSeriesName: attempt.testSeries ? attempt.testSeries.name : 'Unknown Series',
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        status: attempt.status,
        score: attempt.score,
        correct: attempt.correct,
        incorrect: attempt.incorrect,
        unattempted: attempt.unattempted,
        accuracy: attempt.accuracy,
        percentage: attempt.percentage
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Attempts fetched successfully',
      data: attemptList
    });

  } catch (error) {
    console.error('Error getting attempts:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};