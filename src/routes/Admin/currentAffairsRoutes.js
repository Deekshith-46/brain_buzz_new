const express = require('express');
const router = express.Router();

const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');
const upload = require('../../middlewares/uploadMiddleware');

const {
  createCurrentAffair,
  getCurrentAffairs,
  getCurrentAffairById,
  updateCurrentAffair,
  deleteCurrentAffair,
  getCurrentAffairsCategories
} = require('../../controllers/Admin/currentAffairsController');

// --------------------------------------------------
// TEST ROUTE (NO AUTH – FOR QUICK CHECK)
// --------------------------------------------------
router.get('/test', (req, res) => {
  return res.json({
    success: true,
    message: 'Current Affairs route is working ✅'
  });
});

router.use(adminAuthMiddleware);
router.get('/', getCurrentAffairs);
router.get('/categories', getCurrentAffairsCategories);
router.get('/:id', getCurrentAffairById);
router.post('/',upload.single('thumbnail'),createCurrentAffair);
router.put('/:id',upload.single('thumbnail'),updateCurrentAffair);
router.delete('/:id', deleteCurrentAffair);

module.exports = router;

