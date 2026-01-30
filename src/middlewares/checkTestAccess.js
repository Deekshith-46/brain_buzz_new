const TestSeries = require('../models/TestSeries/TestSeries');
const { TestSeriesAccessService } = require('../../services');

// Factory function to create middleware with specific mode
module.exports = (options = {}) => {
  return async (req, res, next) => {
    const userId = req.user?._id;
    const { seriesId, testId } = req.params;

    // 1️⃣ Fetch test series
    const testSeries = await TestSeries.findById(seriesId);
    
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: "Test series not found"
      });
    }

    // 2️⃣ Find the specific test
    const test = testSeries.tests.id(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found in this series"
      });
    }

    // 3️⃣ Check if user already has an active attempt for this test
    const hasActiveAttempt = await TestSeriesAccessService.hasActiveAttempt(userId, seriesId, testId);
    
    // Handle different modes based on the route purpose
    const mode = options.mode || 'DEFAULT'; // START, SUBMIT, LEADERBOARD, or DEFAULT
    
    // Skip active attempt checks for LEADERBOARD mode
    if (mode !== 'LEADERBOARD') {
      if (mode === 'START' && hasActiveAttempt) {
        return res.status(400).json({
          success: false,
          message: "You already have an active attempt for this test. Please complete it first."
        });
      }
      
      if (mode === 'SUBMIT' && !hasActiveAttempt) {
        return res.status(400).json({
          success: false,
          message: "No active test attempt found. Please start the test first."
        });
      }
    }

    // 4️⃣ Determine if test is free based on freeQuota
    const testIndex = testSeries.tests.findIndex(t => t._id.toString() === testId);
    const isTestFree = testIndex < (testSeries.freeQuota || 2);

    // 5️⃣ FREE test series → allow
    if (testSeries.accessType === "FREE" || isTestFree) return next();

    // 6️⃣ Check if user has purchased the series
    const hasAccess = await TestSeriesAccessService.hasTestAccess(userId, seriesId, testId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Please purchase this test series to access this test"
      });
    }

    next();
  };
};