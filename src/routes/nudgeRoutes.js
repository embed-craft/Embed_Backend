const express = require('express');
const router = express.Router();
const nudgeController = require('../controllers/nudgeController');
const apiKeyMiddleware = require('../middleware/authMiddleware');

// Apply Middleware to ALL routes
router.use(apiKeyMiddleware);

// Public API (Mobile SDK)
router.get('/api/v1/nudge/fetch', nudgeController.fetchNudge);
router.post('/api/v1/nudge/track', nudgeController.trackEvent);
router.post('/api/v1/nudge/identify', nudgeController.identifyUser);
router.post('/api/v1/nudge/leads', nudgeController.addLeads);
router.get('/api/v1/nudge/user', nudgeController.getUserDetails);

// Admin API (Internal - accessed by Dashboard with API Key)
router.post('/admin/nudge', nudgeController.createNudge);

module.exports = router;
