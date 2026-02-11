const express = require('express');
const {
  listPublications,
  getPublicationById,
} = require('../../controllers/User/publicationController');
const userAuthMiddleware = require('../../middlewares/User/authMiddleware');

const router = express.Router();

// All routes require authenticated user
router.use(userAuthMiddleware);

router.get('/publications', listPublications);
router.get('/publications/:id', getPublicationById);

module.exports = router;
