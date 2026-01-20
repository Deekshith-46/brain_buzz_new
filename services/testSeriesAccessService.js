// services/testSeriesAccessService.js
const TestSeriesPurchase = require('../src/models/TestSeries/TestSeriesPurchase');
const Purchase = require('../src/models/Purchase/Purchase');

class TestSeriesAccessService {
  // Check if user has access to a test series
  static async hasAccess(userId, testSeriesId) {
    try {
      // Check newer Purchase model first (preferred)
      const purchase = await Purchase.findOne({
        user: userId,
        'items.itemType': 'test_series',
        'items.itemId': testSeriesId,
        status: 'completed',
        expiryDate: { $gt: new Date() }
      });

      if (purchase) {
        return {
          hasAccess: true,
          isValid: true,
          purchase: purchase
        };
      }

      // Fallback to legacy TestSeriesPurchase model
      const legacyPurchase = await TestSeriesPurchase.findOne({
        user: userId,
        testSeries: testSeriesId,
        status: 'completed',
        expiryDate: { $gt: new Date() }
      });

      return {
        hasAccess: !!legacyPurchase,
        isValid: !!legacyPurchase,
        purchase: legacyPurchase
      };
    } catch (error) {
      console.error('Error checking test series access:', error);
      return {
        hasAccess: false,
        isValid: false,
        purchase: null,
        error: error.message
      };
    }
  }

  // Get comprehensive access context for test series
  static async getAccessContext(userId, testSeriesId) {
    try {
      if (!userId || !testSeriesId) {
        return {
          hasAccess: false,
          isValid: false,
          purchase: null,
          expiryDate: null
        };
      }

      const access = await this.hasAccess(userId, testSeriesId);
      
      return {
        hasAccess: access.hasAccess,
        isValid: access.isValid,
        purchase: access.purchase,
        expiryDate: access.purchase?.expiryDate || null
      };
    } catch (error) {
      console.error('Error getting test series access context:', error);
      return {
        hasAccess: false,
        isValid: false,
        purchase: null,
        expiryDate: null,
        error: error.message
      };
    }
  }
}

module.exports = TestSeriesAccessService;