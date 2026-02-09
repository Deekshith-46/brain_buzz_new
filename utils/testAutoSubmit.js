const TestAttempt = require('../src/models/TestSeries/TestAttempt');
const TestSeries = require('../src/models/TestSeries/TestSeries');
const TestRanking = require('../src/models/TestSeries/TestRanking');

// Import dynamic cron manager
const dynamicCronManager = require('./dynamicCronManager');

/**
 * Auto-submit expired test attempts
 * This function should be run periodically (e.g., every 5 minutes) via a cron job
 */
const autoSubmitExpiredTests = async () => {
  try {
    console.log('Starting auto-submit process for expired tests...');
    
    // Find all active test attempts that have exceeded their time limit
    const attempts = await TestAttempt.find({
      resultGenerated: false,  // Only non-submitted attempts
      startedAt: { $exists: true }
    });

    let processedCount = 0;
    let submittedCount = 0;

    for (const attempt of attempts) {
      try {
        // Get the test series and specific test to determine time limit
        const testSeries = await TestSeries.findById(attempt.testSeries);
        if (!testSeries) {
          console.warn(`Test series not found for attempt ${attempt._id}`);
          continue;
        }

        const test = testSeries.tests.id(attempt.testId);
        if (!test) {
          console.warn(`Test not found in series for attempt ${attempt._id}`);
          continue;
        }

        // Calculate time limit based on test duration (if available) or end time
        let timeLimitExpired = false;
        
        if (test.endTime) {
          // If test has an end time, check if current time exceeds it
          const currentTime = new Date();
          const testEndTime = new Date(test.endTime);
          
          if (currentTime > testEndTime) {
            timeLimitExpired = true;
          }
        } else if (test.duration) {
          // If test has a duration (in minutes), calculate based on start time + duration
          const startedAt = new Date(attempt.startedAt);
          const timeLimit = new Date(startedAt.getTime() + (test.duration * 60 * 1000)); // duration in minutes converted to ms
          const currentTime = new Date();
          
          if (currentTime > timeLimit) {
            timeLimitExpired = true;
          }
        }

        if (timeLimitExpired) {
          console.log(`Auto-submitting expired test attempt: ${attempt._id}`);
          
          // Calculate results for the incomplete attempt
          const totalQuestions = test.sections.reduce((total, section) => {
            return total + (section.questions ? section.questions.length : 0);
          }, 0);

          const correct = attempt.responses.filter(r => r.isCorrect).length;
          const incorrect = attempt.responses.filter(r => r.isCorrect === false).length;
          const unattempted = totalQuestions - (correct + incorrect);

          // Calculate score
          let score = 0;
          for (const response of attempt.responses) {
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

          // Calculate time taken
          const timeTakenMs = new Date().getTime() - new Date(attempt.startedAt).getTime();
          const timeTakenMinutes = timeTakenMs / (1000 * 60);
          const speed = timeTakenMinutes > 0 ? (correct + incorrect) / timeTakenMinutes : 0;

          // Update test attempt with results
          attempt.submittedAt = new Date();
          attempt.score = score;
          attempt.correct = correct;
          attempt.incorrect = incorrect;
          attempt.unattempted = unattempted;
          attempt.accuracy = accuracy;
          attempt.speed = speed;
          attempt.percentage = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;
          attempt.resultGenerated = true;

          await attempt.save();

          // Update ranking
          const userRanking = await updateRanking(attempt.testSeries, attempt.testId, attempt.user, score, accuracy);
          
          // Save the rank in the test attempt
          if (userRanking) {
            attempt.rank = userRanking.rank;
            await attempt.save();
          }

          submittedCount++;
          console.log(`Successfully auto-submitted attempt: ${attempt._id}`);
        }
        
        processedCount++;
      } catch (error) {
        console.error(`Error processing attempt ${attempt._id}:`, error);
      }
    }

    console.log(`Auto-submit process completed. Processed: ${processedCount}, Submitted: ${submittedCount}`);
    
    // Check if there are still any in-progress attempts after processing
    // If none remain, we should stop the cron job
    const remainingInProgress = await TestAttempt.countDocuments({
      status: 'IN_PROGRESS',
      resultGenerated: false
    });
    
    if (remainingInProgress === 0) {
      // Stop the auto-submit job if no tests are in progress anymore
      dynamicCronManager.stopAutoSubmitJob();
    }
  } catch (error) {
    console.error('Error in auto-submit process:', error);
  }
};

// Helper function to update ranking (same as in controller)
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

    // Recalculate all ranks for this test - use the correct formula: rank = count(score > myScore) + 1
    const allRankings = await TestRanking.find({ testId }).sort({ score: -1 });

    // Update ranks based on score comparison
    for (let i = 0; i < allRankings.length; i++) {
      // Count how many participants have higher scores than this participant
      const higherScorers = await TestRanking.countDocuments({ 
        testId, 
        score: { $gt: allRankings[i].score } 
      });
      
      allRankings[i].rank = higherScorers + 1;
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

module.exports = {
  autoSubmitExpiredTests
};