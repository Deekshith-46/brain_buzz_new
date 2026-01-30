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
      // Check newer Purchase model first
      const purchase = await Purchase.findOne({
        user: userId,
        "items.itemId": testSeriesId,
        "items.itemType": "test_series"
      });

      if (purchase) {
        // Check if purchase is valid based on validity period
        const isValid = this.validatePurchase(purchase, testSeriesId);
        const expiryDate = this.calculateExpiryDate(purchase, testSeriesId);

        return {
          hasAccess: true,
          isValid,
          purchase,
          expiryDate
        };
      }

      // Fallback to legacy TestSeriesPurchase model if newer model doesn't have it
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

      // Check if user has purchased the test series
      const accessInfo = await this.getAccessInfo(userId, seriesId);
      return accessInfo.hasAccess && accessInfo.isValid;
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

      // Check if user has purchased the series
      const accessInfo = await this.getAccessInfo(userId, seriesId);
      return accessInfo.hasAccess && accessInfo.isValid;
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
   * Validate a purchase based on validity period
   */
  static validatePurchase(purchase, testSeriesId) {
    if (!purchase) return false;

    // Check if purchase is for the correct test series
    const item = purchase.items.find(item => 
      item.itemId.toString() === testSeriesId.toString() && 
      item.itemType === 'test_series'
    );
    
    if (!item) return false;

    // If there's no validity period, assume it's always valid
    if (!purchase.validityPeriod) {
      return true;
    }

    // Check if purchase is still within validity period
    const purchaseDate = new Date(purchase.createdAt);
    const validityDays = purchase.validityPeriod.durationInDays;
    const expiryDate = new Date(purchaseDate.getTime() + (validityDays * 24 * 60 * 60 * 1000));

    return new Date() <= expiryDate;
  }

  /**
   * Calculate expiry date for a purchase
   */
  static calculateExpiryDate(purchase, testSeriesId) {
    if (!purchase) return null;

    // Check if purchase is for the correct test series
    const item = purchase.items.find(item => 
      item.itemId.toString() === testSeriesId.toString() && 
      item.itemType === 'test_series'
    );
    
    if (!item) return null;

    if (!purchase.validityPeriod) {
      return null; // No expiry
    }

    const purchaseDate = new Date(purchase.createdAt);
    const validityDays = purchase.validityPeriod.durationInDays;
    return new Date(purchaseDate.getTime() + (validityDays * 24 * 60 * 60 * 1000));
  }

  /**
   * Validate legacy purchase
   */
  static validateLegacyPurchase(legacyPurchase) {
    if (!legacyPurchase) return false;

    // Check if legacy purchase has expired
    if (legacyPurchase.expiryDate && new Date() > new Date(legacyPurchase.expiryDate)) {
      return false;
    }

    return true;
  }
}

module.exports = TestSeriesAccessService;