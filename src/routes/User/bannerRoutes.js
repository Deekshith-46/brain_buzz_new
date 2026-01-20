const express = require('express');
const router = express.Router();
const bannerController = require('../../controllers/User/bannerController');

// Route for getting home banner
router.get('/home-banner', bannerController.getHomeBanner);

// Route for getting about banner
router.get('/about-banner', bannerController.getAboutBanner);

module.exports = router;