const express = require('express');
const router = express.Router();

const { validate } = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');
const recommendationController = require('../controllers/recommendationController');

// All recommendation routes require authentication
router.use(requireAuth);

router.get('/', validate('recommendations'), recommendationController.getRecommendations);

module.exports = router;
