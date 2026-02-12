const express = require('express');
const router = express.Router();
const { getValidities, getValidityInfo } = require('../../controllers/User/constantsController');

// Public routes - no authentication required
router.get('/validities', getValidities);
router.get('/validities/:label', getValidityInfo);

module.exports = router;