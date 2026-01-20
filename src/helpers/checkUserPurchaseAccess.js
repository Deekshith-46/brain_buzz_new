const Purchase = require("../models/Purchase/Purchase");

/**
 * Check if user has purchased and if the purchase is valid (not expired)
 * @param {Object} params - Parameters for the access check
 * @param {string} params.userId - User ID to check
 * @param {string} params.itemType - Type of item ('online_course' or 'test_series')
 * @param {string} params.itemId - Item ID to check
 * @returns {Promise<Object>} Access information object
 */
module.exports = async ({ userId, itemType, itemId }) => {
  try {
    const purchase = await Purchase.findOne({
      user: userId,
      status: "completed",
      "items.itemType": itemType,
      "items.itemId": itemId
    });

    if (!purchase) {
      return { 
        hasPurchased: false, 
        isValid: false,
        expiryDate: null
      };
    }

    const now = new Date();
    const isValid = now <= purchase.expiryDate;

    return {
      hasPurchased: true,
      isValid,
      expiryDate: purchase.expiryDate,
      purchaseId: purchase._id,
      amount: purchase.finalAmount,
      discountAmount: purchase.discountAmount
    };
  } catch (error) {
    console.error('Error checking user purchase access:', error);
    throw error;
  }
};