const express = require('express');
const router = express.Router();

const moodRoutes = require('./moodRoutes');
const preferencesRoutes = require('./preferencesRoutes');
const recommendationRoutes = require('./recommendationRoutes');
const feedbackRoutes = require('./feedbackRoutes');

// Mount routes owned by Aditya Jha
router.use('/mood', moodRoutes);
router.use('/preferences', preferencesRoutes);

// Mount routes owned by Niraj Chandekar
router.use('/recommendations', recommendationRoutes);
router.use('/feedback', feedbackRoutes);

module.exports = router;
