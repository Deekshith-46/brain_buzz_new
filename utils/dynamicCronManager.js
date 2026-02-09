/**
 * Dynamic Cron Manager for Auto-Submit Jobs
 * Manages auto-submit cron jobs that start when users begin tests and stop when all tests are completed
 */

const cron = require('node-cron');
const TestAttempt = require('../src/models/TestSeries/TestAttempt');
const { processExpiredAttempts } = require('./examAutoSubmit');

class DynamicCronManager {
  constructor() {
    this.autoSubmitJob = null;
    this.activeTestsCount = 0;
    this.checkInterval = null;
  }

  /**
   * Start the auto-submit job if not already running
   */
  startAutoSubmitJob() {
    if (!this.autoSubmitJob) {
      console.log('Starting auto-submit cron job...');
      
      // Schedule the auto-submit job to run every 30 seconds
      this.autoSubmitJob = cron.schedule('*/30 * * * * *', async () => {
        console.log('Running scheduled auto-submit check...');
        await processExpiredAttempts();
      });

      console.log('Auto-submit cron job started successfully');
    }
    
    this.activeTestsCount++;
    console.log(`Active tests count: ${this.activeTestsCount}`);
  }

  /**
   * Stop the auto-submit job when no active tests remain
   */
  stopAutoSubmitJob() {
    if (this.activeTestsCount > 0) {
      this.activeTestsCount--;
      console.log(`Active tests count: ${this.activeTestsCount}`);
    }

    // Stop the job only when no tests are active
    if (this.activeTestsCount === 0 && this.autoSubmitJob) {
      console.log('Stopping auto-submit cron job...');
      this.autoSubmitJob.destroy();
      this.autoSubmitJob = null;
      console.log('Auto-submit cron job stopped');
    }
  }

  /**
   * Check for active tests in the database and adjust cron job accordingly
   */
  async initializeFromDatabase() {
    try {
      // Count all in-progress test attempts
      const inProgressCount = await TestAttempt.countDocuments({
        status: 'IN_PROGRESS',
        resultGenerated: false
      });

      console.log(`Found ${inProgressCount} in-progress test attempts`);

      if (inProgressCount > 0) {
        // Start the job if there are active tests
        this.activeTestsCount = inProgressCount;
        this.startAutoSubmitJob();
      }
    } catch (error) {
      console.error('Error initializing from database:', error);
    }
  }

  /**
   * Get current status of the cron manager
   */
  getStatus() {
    return {
      isActive: !!this.autoSubmitJob,
      activeTestsCount: this.activeTestsCount
    };
  }
}

// Create a singleton instance
const dynamicCronManager = new DynamicCronManager();

module.exports = dynamicCronManager;