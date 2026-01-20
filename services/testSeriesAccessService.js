const Purchase = require('../src/models/Purchase/Purchase');

class TestSeriesAccessService {
  /**
   * Check if user has access to a test series
   * @param {string} userId - User ID
   * @param {string} testSeriesId - Test series ID
   * @returns {Promise<boolean>} - Whether user has access
   */
  static async hasAccess(userId, testSeriesId) {
    if (!userId || !testSeriesId) {
      return false;
    }

    try {
      const purchase = await Purchase.findOne({
        user: userId,
        status: 'completed',
        'items.itemType': 'test_series',
        'items.itemId': testSeriesId,
        expiryDate: { $gt: new Date() } // Check if not expired
      });

      return !!purchase;
    } catch (error) {
      console.error('Error checking test series access:', error);
      return false;
    }
  }

  /**
   * Get access information for a test series
   * @param {string} userId - User ID
   * @param {string} testSeriesId - Test series ID
   * @returns {Promise<Object>} - Access information
   */
  static async getAccessInfo(userId, testSeriesId) {
    if (!userId || !testSeriesId) {
      return { hasAccess: false, isValid: false, expiryDate: null };
    }

    try {
      const purchase = await Purchase.findOne({
        user: userId,
        status: 'completed',
        'items.itemType': 'test_series',
        'items.itemId': testSeriesId
      });

      if (!purchase) {
        return { hasAccess: false, isValid: false, expiryDate: null };
      }

      const now = new Date();
      const isValid = now <= purchase.expiryDate;

      return {
        hasAccess: true,
        isValid,
        expiryDate: purchase.expiryDate,
        purchaseId: purchase._id
      };
    } catch (error) {
      console.error('Error getting test series access info:', error);
      return { hasAccess: false, isValid: false, expiryDate: null };
    }
  }
}

module.exports = TestSeriesAccessService;