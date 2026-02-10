const express = require('express');
const router = express.Router();
const bannerController = require('../../controllers/Admin/bannerController');
const uploadMiddleware = require('../../middlewares/uploadMiddleware');

// Route for creating/updating banner (upsert)
router.post('/', uploadMiddleware.fields([{ name: 'images', maxCount: 10 }, { name: 'aboutImages', maxCount: 10 }]), bannerController.upsertBanner);

// Route for getting banner by page type and site type
router.get('/:pageType/:siteType', bannerController.getBanner);

// Route for deleting banner by page type and site type
router.delete('/:pageType/:siteType', bannerController.deleteBanner);

// Route for updating specific image in banner (using _id)
router.put('/:pageType/:siteType/images/:imageId', uploadMiddleware.single('image'), bannerController.updateBannerImage);

// Route for updating About section (single endpoint for all partial updates)
router.patch('/about/:siteType', uploadMiddleware.fields([{ name: 'aboutImages', maxCount: 10 }]), bannerController.updateAboutSection);

module.exports = router;