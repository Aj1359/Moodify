const express = require('express');
const router = express.Router();

const { validate } = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');
const preferencesController = require('../controllers/preferencesController');

// All preferences routes require authentication
router.use(requireAuth);

router.get('/', preferencesController.getPreferences);
router.put('/', validate('updatePreferences'), preferencesController.updatePreferences);

module.exports = router;

