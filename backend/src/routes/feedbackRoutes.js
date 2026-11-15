const express = require('express');
const router = express.Router();

const { validate } = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');
const feedbackController = require('../controllers/feedbackController');

// All feedback routes require authentication
router.use(requireAuth);

router.post('/', validate('feedback'), feedbackController.postFeedback);
router.get('/liked', feedbackController.getLikedSongs);

module.exports = router;

