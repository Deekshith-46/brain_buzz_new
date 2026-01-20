const express = require('express');
const router = express.Router();
const bannerController = require('../../controllers/Admin/bannerController');
const uploadMiddleware = require('../../middlewares/uploadMiddleware');

// Route for creating/updating banner (upsert)
router.post('/', uploadMiddleware.fields([{ name: 'images', maxCount: 10 }]), bannerController.upsertBanner);

// Route for getting banner by page type
router.get('/:pageType', bannerController.getBanner);

// Route for deleting banner by page type
router.delete('/:pageType', bannerController.deleteBanner);

// Route for updating specific image in banner (using _id)
router.put('/:pageType/images/:imageId', uploadMiddleware.single('image'), bannerController.updateBannerImage);

module.exports = router;