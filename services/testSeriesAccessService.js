const TestSeries = require('../src/models/TestSeries/TestSeries');
const Purchase = require('../src/models/Purchase/Purchase');
const TestAttempt = require('../src/models/TestSeries/TestAttempt');

class TestSeriesAccessService {
  /**
   * Get comprehensive access information for a user and test series
   */
  static async getAccessInfo(userId, testSeriesId) {
    if (!userId || !testSeriesId) {
      return {
        hasAccess: false,
        isValid: false,
        purchase: null,
        expiryDate: null
      };
    }

    try {
      // Check newer Purchase model first with proper validation
      const purchase = await Purchase.findOne({
        user: userId,
        "items.itemId": testSeriesId,
        "items.itemType": "test_series",
        status: "completed",
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: { $gt: new Date() } }
        ]
      });

      if (purchase) {
        // Check if purchase is valid based on status and expiry
        const isValid = this.validatePurchase(purchase);
        const expiryDate = this.calculateExpiryDate(purchase, testSeriesId);

        return {
          hasAccess: true,
          isValid,
          purchase,
          expiryDate
        };
      }

      // Fallback to legacy TestSeriesPurchase model if newer model doesn't have it
      // Only enable in development/testing environments
      if (process.env.ENABLE_LEGACY_PURCHASES !== 'true') {
        return {
          hasAccess: false,
          isValid: false,
          purchase: null,
          expiryDate: null
        };
      }
      
      const LegacyTestSeriesPurchase = require('../src/models/TestSeries/TestSeriesPurchase');
      const legacyPurchase = await LegacyTestSeriesPurchase.findOne({
        user: userId,
        testSeries: testSeriesId
      });

      if (legacyPurchase) {
        // Check if legacy purchase is valid
        const isValid = this.validateLegacyPurchase(legacyPurchase);
        const expiryDate = legacyPurchase.expiryDate;

        return {
          hasAccess: true,
          isValid,
          purchase: legacyPurchase,
          expiryDate
        };
      }

      // No purchase found
      return {
        hasAccess: false,
        isValid: false,
        purchase: null,
        expiryDate: null
      };
    } catch (error) {
      console.error('Error checking Test Series access:', error);
      return {
        hasAccess: false,
        isValid: false,
        purchase: null,
        expiryDate: null
      };
    }
  }

  /**
   * Check if user has access to a specific test within a series
   */
  static async hasTestAccess(userId, seriesId, testId) {
    if (!userId || !seriesId || !testId) {
      return false;
    }

    try {
      // Get the test series to check free quota
      const testSeries = await TestSeries.findById(seriesId);
      if (!testSeries) {
        return false;
      }

      // Find the test index to check if it's within free quota
      const testIndex = testSeries.tests.findIndex(t => t._id.toString() === testId);
      const isTestFree = testIndex < (testSeries.freeQuota || 2);

      // If it's a free test, grant access
      if (isTestFree) {
        return true;
      }

      // Check if user has purchased the test series with proper validation
      const purchase = await Purchase.findOne({
        user: userId,
        "items.itemId": seriesId,
        "items.itemType": "test_series",
        status: "completed",
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: { $gt: new Date() } }
        ]
      });
      return !!purchase;
    } catch (error) {
      console.error('Error checking test access:', error);
      return false;
    }
  }

  /**
   * Check if user has access to a test series (simplified method)
   */
  static async hasSeriesAccess(userId, seriesId) {
    if (!userId || !seriesId) {
      return false;
    }

    try {
      // Check if it's a free series
      const testSeries = await TestSeries.findById(seriesId);
      if (!testSeries) {
        return false;
      }

      if (testSeries.accessType === "FREE") {
        return true;
      }

      // Check if user has purchased the series with proper validation
      const purchase = await Purchase.findOne({
        user: userId,
        "items.itemId": seriesId,
        "items.itemType": "test_series",
        status: "completed",
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: { $gt: new Date() } }
        ]
      });
      return !!purchase;
    } catch (error) {
      console.error('Error checking series access:', error);
      return false;
    }
  }

  /**
   * Check if user has an active attempt for a specific test
   */
  static async hasActiveAttempt(userId, seriesId, testId) {
    if (!userId || !seriesId || !testId) {
      return false;
    }

    try {
      const activeAttempt = await TestAttempt.findOne({
        user: userId,
        testSeries: seriesId,
        testId: testId,
        resultGenerated: { $ne: true }  // Only check for non-completed attempts
      });

      return !!activeAttempt;
    } catch (error) {
      console.error('Error checking active attempt:', error);
      return false;
    }
  }

  /**
   * Check if user has completed a specific test
   */
  static async hasCompletedTest(userId, seriesId, testId) {
    if (!userId || !seriesId || !testId) {
      return false;
    }

    try {
      const completedAttempt = await TestAttempt.findOne({
        user: userId,
        testSeries: seriesId,
        testId: testId,
        resultGenerated: true
      });

      return !!completedAttempt;
    } catch (error) {
      console.error('Error checking completed test:', error);
      return false;
    }
  }

  /**
   * Validate a purchase based on status and expiry date
   */
  static validatePurchase(purchase) {
    if (!purchase) return false;
    if (purchase.status !== 'completed') return false;
    // If no expiryDate, treat as lifetime access
    if (purchase.expiryDate && purchase.expiryDate <= new Date()) return false;
    return true;
  }

  /**
   * Get expiry date from purchase
   */
  static calculateExpiryDate(purchase, testSeriesId) {
    if (!purchase) return null;
    return purchase.expiryDate || null;
  }

  /**
   * Validate legacy purchase (only used when legacy purchases are enabled)
   */
  static validateLegacyPurchase(legacyPurchase) {
    if (!legacyPurchase) return false;
    if (legacyPurchase.expiryDate && new Date() > new Date(legacyPurchase.expiryDate)) {
      return false;
    }
    return true;
  }
}

module.exports = TestSeriesAccessService;