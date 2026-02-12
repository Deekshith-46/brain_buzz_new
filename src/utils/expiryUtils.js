// src/utils/expiryUtils.js
// Utility functions for calculating expiry dates based on validity enums

const { VALIDITY_MAP, VALIDITY_LABELS } = require('../constants/validityMap');

const DAY = 24 * 60 * 60 * 1000; // milliseconds in a day

/**
 * Calculate expiry date from validity label and start date
 * @param {string} validityLabel - Validity enum value (e.g., '1_YEAR', 'UNLIMITED')
 * @param {Date} startDate - Start date for calculation (defaults to now)
 * @returns {Date|null} Expiry date or null for UNLIMITED validity
 */
exports.calculateExpiryDate = (validityLabel, startDate = new Date()) => {
  // Validate that the validity label exists in our map
  if (!VALIDITY_MAP.hasOwnProperty(validityLabel)) {
    throw new Error(`Invalid validity label: ${validityLabel}`);
  }

  const days = VALIDITY_MAP[validityLabel];

  // Handle UNLIMITED validity - return null (no expiry)
  if (days === null) {
    return null;
  }

  // Calculate expiry date by adding days to start date
  const expiryDate = new Date(startDate);
  expiryDate.setTime(expiryDate.getTime() + days * DAY);
  
  return expiryDate;
};

/**
 * Get maximum validity period from array of validity labels
 * @param {string[]} validityLabels - Array of validity enum values
 * @param {Date} startDate - Start date for calculation (defaults to now)
 * @returns {Date|null} Maximum expiry date or null if any validity is UNLIMITED
 */
exports.getMaxExpiryDate = (validityLabels, startDate = new Date()) => {
  if (!Array.isArray(validityLabels) || validityLabels.length === 0) {
    // Default to 1 year if no validities provided
    return exports.calculateExpiryDate('1_YEAR', startDate);
  }

  // If any validity is UNLIMITED, return null (no expiry)
  if (validityLabels.includes('UNLIMITED')) {
    return null;
  }

  // Find the validity with maximum days
  let maxDays = 0;
  for (const label of validityLabels) {
    const days = VALIDITY_MAP[label];
    if (days !== undefined && days > maxDays) {
      maxDays = days;
    }
  }

  // If no valid labels found, default to 1 year
  if (maxDays === 0) {
    return exports.calculateExpiryDate('1_YEAR', startDate);
  }

  // Calculate expiry date with maximum days
  const expiryDate = new Date(startDate);
  expiryDate.setTime(expiryDate.getTime() + maxDays * DAY);
  
  return expiryDate;
};

/**
 * Check if a purchase is still valid based on expiry date
 * @param {Date|null} expiryDate - Expiry date from purchase record
 * @param {Date} currentDate - Current date for comparison (defaults to now)
 * @returns {boolean} True if valid, false if expired
 */
exports.isPurchaseValid = (expiryDate, currentDate = new Date()) => {
  // UNLIMITED validity (null expiry) is always valid
  if (expiryDate === null) {
    return true;
  }

  // Check if current date is before expiry date
  return new Date(currentDate) < new Date(expiryDate);
};

/**
 * Enhanced purchase validation with explicit unlimited handling
 * @param {Object} purchase - Purchase record with expiryDate field
 * @param {Date} currentDate - Current date for validation
 * @returns {Object} Validation result with detailed status
 */
exports.validatePurchaseAccess = (purchase, currentDate = new Date()) => {
  if (!purchase) {
    return {
      hasAccess: false,
      isValid: false,
      reason: 'No purchase record found',
      isUnlimited: false,
      daysRemaining: null
    };
  }

  // Handle unlimited validity
  if (purchase.expiryDate === null) {
    return {
      hasAccess: true,
      isValid: true,
      reason: 'Unlimited validity - access granted permanently',
      isUnlimited: true,
      daysRemaining: null
    };
  }

  // Handle regular validity with expiry date
  const isValid = exports.isPurchaseValid(purchase.expiryDate, currentDate);
  
  if (isValid) {
    const daysRemaining = Math.ceil((new Date(purchase.expiryDate) - new Date(currentDate)) / DAY);
    return {
      hasAccess: true,
      isValid: true,
      reason: `Valid access - ${daysRemaining} days remaining`,
      isUnlimited: false,
      daysRemaining: daysRemaining
    };
  } else {
    const daysExpired = Math.floor((new Date(currentDate) - new Date(purchase.expiryDate)) / DAY);
    return {
      hasAccess: false,
      isValid: false,
      reason: `Access expired ${daysExpired} days ago`,
      isUnlimited: false,
      daysRemaining: -daysExpired
    };
  }
};

/**
 * Format validity label for display
 * @param {string} validityLabel - Validity enum value
 * @returns {string} Human-readable validity description
 */
exports.formatValidityLabel = (validityLabel) => {
  const { VALIDITY_DISPLAY_NAMES } = require('../constants/validityMap');
  
  if (VALIDITY_DISPLAY_NAMES.hasOwnProperty(validityLabel)) {
    return VALIDITY_DISPLAY_NAMES[validityLabel];
  }
  
  return validityLabel; // fallback to original label
};

/**
 * Get exact days for a validity label
 * @param {string} validityLabel - Validity enum value
 * @returns {number|null} Number of days or null for UNLIMITED
 */
exports.getValidityDays = (validityLabel) => {
  if (!VALIDITY_MAP.hasOwnProperty(validityLabel)) {
    throw new Error(`Invalid validity label: ${validityLabel}`);
  }
  
  return VALIDITY_MAP[validityLabel];
};

/**
 * Validate that a validity label is supported
 * @param {string} validityLabel - Validity enum value to validate
 * @returns {boolean} True if valid, false otherwise
 */
exports.isValidityLabel = (validityLabel) => {
  return VALIDITY_MAP.hasOwnProperty(validityLabel);
};

/**
 * Compute purchase expiry date from items and purchase date
 * SINGLE SOURCE OF TRUTH for expiry calculation
 * @param {Array} items - Purchase items with validity selections
 * @param {Date} purchaseDate - When purchase was made
 * @returns {Date|null} Computed expiry date
 */
exports.computePurchaseExpiry = (items, purchaseDate = new Date()) => {
  if (!Array.isArray(items) || items.length === 0) {
    return exports.calculateExpiryDate('1_YEAR', purchaseDate);
  }
  
  // For multiple items, use the longest validity period
  // UNLESS any item is UNLIMITED, then whole purchase is unlimited
  const validityLabels = items.map(item => item.validity).filter(Boolean);
  
  if (validityLabels.length === 0) {
    return exports.calculateExpiryDate('1_YEAR', purchaseDate);
  }
  
  return exports.getMaxExpiryDate(validityLabels, purchaseDate);
};