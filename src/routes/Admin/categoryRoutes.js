const express = require('express');
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require('../../controllers/Admin/categoryController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');
const upload = require('../../middlewares/uploadMiddleware');

const router = express.Router();

router.use(adminAuthMiddleware);

router.post('/', upload.single('thumbnail'), createCategory);
router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.put('/:id', upload.single('thumbnail'), updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
