/**
 * Background Auto-submit System for CBT Exams
 * Ensures time-based submission even when users disconnect
 */

const TestAttempt = require('../src/models/TestSeries/TestAttempt');
const TestSeries = require('../src/models/TestSeries/TestSeries');
const { updateRanking } = require('../src/controllers/User/testAttemptController');

// Import dynamic cron manager
const dynamicCronManager = require('./dynamicCronManager');

// Auto-submit attempts that have expired
const processExpiredAttempts = async () => {
  try {
    console.log('Running auto-submit check...');
    
    // Find all in-progress attempts that should have expired
    const expiredAttempts = await TestAttempt.find({
      status: 'IN_PROGRESS',
      resultGenerated: false,
      testSnapshot: { $exists: true }
    });
    
    let processedCount = 0;
    
    for (const attempt of expiredAttempts) {
      try {
        // Calculate if time has actually expired
        const now = new Date();
        const startTime = new Date(attempt.startedAt);
        const timeElapsed = (now.getTime() - startTime.getTime()) / 1000;
        const remainingTime = Math.max(0, Math.floor(attempt.testSnapshot.durationInSeconds - timeElapsed));
        
        // Only process if time has actually expired
        if (remainingTime <= 0) {
          await autoSubmitAttempt(attempt);
          processedCount++;
        }
      } catch (error) {
        console.error(`Error processing attempt ${attempt._id}:`, error);
      }
    }
    
    if (processedCount > 0) {
      console.log(`Auto-submitted ${processedCount} expired attempts`);
    }
    
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
    
    return processedCount;
  } catch (error) {
    console.error('Error in auto-submit process:', error);
    return 0;
  }
};

// Auto-submit a single attempt
const autoSubmitAttempt = async (attempt) => {
  try {
    // Atomically submit the test
    const updatedAttempt = await TestAttempt.findOneAndUpdate(
      {
        _id: attempt._id,
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

    // Calculate results using snapshot
    const testSnapshot = updatedAttempt.testSnapshot;
    if (!testSnapshot) {
      throw new Error('Test snapshot not found for auto-submit');
    }
    
    const totalQuestions = testSnapshot.sections.reduce((total, section) => {
      return total + (section.questions ? section.questions.length : 0);
    }, 0);

    const correct = updatedAttempt.responses.filter(r => r.isCorrect).length;
    const incorrect = updatedAttempt.responses.filter(r => r.isCorrect === false).length;
    const unattempted = totalQuestions - (correct + incorrect);

    // Calculate score using snapshot data
    let score = 0;
    for (const response of updatedAttempt.responses) {
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

    const accuracy = correct + incorrect > 0 ? (correct / (correct + incorrect)) * 100 : 0;
    
    const timeTakenMs = updatedAttempt.submittedAt ? 
      new Date(updatedAttempt.submittedAt).getTime() - new Date(updatedAttempt.startedAt).getTime() :
      new Date().getTime() - new Date(updatedAttempt.startedAt).getTime();
    
    const timeTakenMinutes = timeTakenMs / (1000 * 60);
    const speed = timeTakenMinutes > 0 ? (correct + incorrect) / timeTakenMinutes : 0;

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
        await updateRanking(
          updatedAttempt.testSeries.toString(), 
          updatedAttempt.testId, 
          updatedAttempt.user, 
          score, 
          accuracy
        );
      } catch (error) {
        console.error('Error updating ranking in auto-submit:', error);
      }
    });

    console.log(`Auto-submitted test attempt ${attempt._id} due to time expiry`);
    return true;
  } catch (error) {
    console.error(`Error auto-submitting attempt ${attempt._id}:`, error);
    return false;
  }
};

// Start background auto-submit job
const startAutoSubmitJob = (intervalMs = 30000) => { // Default: every 30 seconds
  console.log(`Starting auto-submit job with ${intervalMs}ms interval`);
  
  // Run immediately once
  processExpiredAttempts();
  
  // Then run periodically
  const job = setInterval(async () => {
    await processExpiredAttempts();
  }, intervalMs);
  
  return job;
};

// Manual trigger for testing
const triggerAutoSubmit = async () => {
  return await processExpiredAttempts();
};

module.exports = {
  startAutoSubmitJob,
  triggerAutoSubmit,
  processExpiredAttempts,
  autoSubmitAttempt
};