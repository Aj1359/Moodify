const express = require('express');
const router = express.Router();

const moodRoutes = require('./moodRoutes');
const preferencesRoutes = require('./preferencesRoutes');

// Mount routes owned by Aditya Jha
router.use('/mood', moodRoutes);
router.use('/preferences', preferencesRoutes);

// Niraj's routes will be mounted when available:
// router.use('/recommendations', recommendationRoutes);
// router.use('/feedback', feedbackRoutes);

module.exports = router;
