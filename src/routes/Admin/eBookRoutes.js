const express = require('express');
const {
  createEBook,
  getEBooks,
  getEBookById,
  updateEBook,
  deleteEBook,
  updateBook,
  updateThumbnail,
  updateCategories
} = require('../../controllers/Admin/eBookController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');
const upload = require('../../middlewares/uploadMiddleware');

const router = express.Router();

router.use(adminAuthMiddleware);

router.post(
  '/',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'bookFile', maxCount: 1 },
  ]),
  createEBook
);

router.get('/', getEBooks);
router.get('/:id', getEBookById);

// Main PATCH route for simple fields only
router.patch('/:id', upload.none(), updateEBook);

// Book file route
router.put('/:id/book', upload.single('bookFile'), updateBook);

// Thumbnail route
router.put('/:id/thumbnail', upload.single('thumbnail'), updateThumbnail);

// Categories route
router.put('/:id/categories', updateCategories);

router.delete('/:id', deleteEBook);

module.exports = router;