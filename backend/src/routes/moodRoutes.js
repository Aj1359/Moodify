const express = require('express');
const router = express.Router();

const { validate } = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');
const moodController = require('../controllers/moodController');

// All mood routes require authentication
router.use(requireAuth);

router.post('/analyze', validate('analyzeMood'), moodController.analyze);
router.post('/confirm', validate('confirmMood'), moodController.confirm);
router.get('/history', validate('moodHistory'), moodController.history);
router.delete('/:id', validate('deleteMood'), moodController.deleteMood);

module.exports = router;

