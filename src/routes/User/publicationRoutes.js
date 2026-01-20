const express = require('express');
const {
  listPublications,
  getPublicationById,
} = require('../../controllers/User/publicationController');

const router = express.Router();

router.get('/publications', listPublications);
router.get('/publications/:id', getPublicationById);

module.exports = router;
