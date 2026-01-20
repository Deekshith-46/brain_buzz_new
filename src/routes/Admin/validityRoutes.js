const express = require('express');
const {
  createValidity,
  getValidities,
  getValidityById,
  updateValidity,
  deleteValidity,
} = require('../../controllers/Admin/validityController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');

const router = express.Router();

router.use(adminAuthMiddleware);

router.post('/', createValidity);
router.get('/', getValidities);
router.get('/:id', getValidityById);
router.put('/:id', updateValidity);
router.delete('/:id', deleteValidity);

module.exports = router;
