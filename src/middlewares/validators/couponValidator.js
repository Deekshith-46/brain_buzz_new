// middlewares/validators/couponValidator.js
const { body, param } = require('express-validator');

exports.validateCouponCreation = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required')
    .isLength({ min: 4, max: 20 })
    .withMessage('Coupon code must be between 4 and 20 characters')
    .matches(/^[A-Za-z0-9-]+$/)
    .withMessage('Coupon code can only contain letters, numbers, and hyphens'),

  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('discountType')
    .isIn(['percentage', 'fixed'])
    .withMessage('Invalid discount type'),

  body('discountValue')
    .isFloat({ min: 0.01 })
    .withMessage('Discount value must be greater than 0'),

  body('minPurchaseAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum purchase amount must be 0 or greater'),

  body('maxUses')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum uses must be a positive integer'),

  body('maxUsesPerUser')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum uses per user must be a positive integer'),

  body('validFrom')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date')
    .custom((value, { req }) => {
      // Parse the date string (format: YYYY-MM-DD) in local timezone
      const dateParts = value.split('-');
      if (dateParts.length !== 3) {
        return true; // Let isISO8601 handle format validation
      }
      
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
      const day = parseInt(dateParts[2]);
      
      const startDate = new Date(year, month, day);
      const today = new Date();
      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Compare dates - allow today and future dates
      if (startDate < todayMidnight) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),

  body('validUntil')
    .isISO8601()
    .withMessage('Invalid expiry date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    })
    .custom((value, { req }) => {
      if (req.body.validFrom && new Date(value) <= new Date(req.body.validFrom)) {
        throw new Error('Expiry date must be after start date');
      }
      return true;
    }),

  body('applicableItems')
    .optional()
    .isArray()
    .withMessage('Applicable items must be an array')
    .custom((items) => {
      if (!Array.isArray(items)) return true;
      
      return items.every(item => {
        if (!['test_series', 'online_course', 'all'].includes(item.itemType)) {
          throw new Error('Invalid item type in applicable items');
        }
        return true;
      });
    })
];

exports.validateCouponUpdate = [
  param('couponId')
    .isMongoId()
    .withMessage('Invalid coupon ID'),

  body('discountValue')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Discount value must be greater than 0'),

  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiry date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    })
];