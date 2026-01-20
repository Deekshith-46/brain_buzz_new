const express = require('express');
const router = express.Router();
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');
const { uploadThumbnail } = require('../../controllers/Admin/liveClassController');
const {
  createLiveClass,
  getAllLiveClasses,
  getLiveClassById,
  updateLiveClass,
  deleteLiveClass,
  toggleLiveClassStatus,
} = require('../../controllers/Admin/liveClassController');

// Apply admin auth middleware to all routes
router.use(adminAuthMiddleware);

// Create a new Live Class - with file upload middleware
router.post('/', uploadThumbnail, createLiveClass);

// Get all Live Classes with filtering
router.get('/', getAllLiveClasses);

// Get a single Live Class by ID
router.get('/:id', getLiveClassById);

// Update a Live Class - with file upload middleware
router.put('/:id', uploadThumbnail, updateLiveClass);

// Delete a Live Class
router.delete('/:id', deleteLiveClass);

// Activate/Deactivate a Live Class
router.patch('/:id/status', toggleLiveClassStatus);

module.exports = router;