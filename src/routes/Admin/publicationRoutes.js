const express = require('express');
const {
  createPublication,
  getPublications,
  getPublicationById,
  updatePublication,
  deletePublication,
  addAuthor,
  updateAuthor,
  deleteAuthor,
  addImage,
  removeImage,
  updateBook,
  updateThumbnail,
  updateCategories
} = require('../../controllers/Admin/publicationController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');
const upload = require('../../middlewares/uploadMiddleware');

const router = express.Router();

router.use(adminAuthMiddleware);

router.post(
  '/',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'authorImages', maxCount: 10 },
    { name: 'galleryImages', maxCount: 20 },
    { name: 'bookFile', maxCount: 1 },
  ]),
  createPublication
);

router.get('/', getPublications);
router.get('/:id', getPublicationById);

// Main PATCH route for simple fields only
router.patch('/:id', upload.none(), updatePublication);

// Authors routes
router.post('/:id/authors', upload.single('authorImage'), addAuthor);
router.put('/:id/authors/:authorId', upload.single('authorImage'), updateAuthor);
router.delete('/:id/authors/:authorId', deleteAuthor);

// Gallery images routes
router.post('/:id/images', upload.single('image'), addImage);
router.delete('/:id/images', removeImage);

// Book file route
router.put('/:id/book', upload.single('bookFile'), updateBook);

// Thumbnail route
router.put('/:id/thumbnail', upload.single('thumbnail'), updateThumbnail);

// Categories route
router.put('/:id/categories', updateCategories);

router.delete('/:id', deletePublication);

module.exports = router;