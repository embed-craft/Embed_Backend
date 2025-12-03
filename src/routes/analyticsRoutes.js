const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const apiKeyMiddleware = require('../middleware/authMiddleware');

// Apply Middleware
router.use(apiKeyMiddleware);

// Dashboard Stats
// Dashboard Stats
router.get('/dashboard', analyticsController.getDashboardStats);

// User Analytics
router.get('/users', analyticsController.getUsers);
router.get('/users/:userId', analyticsController.getUserDetails);

module.exports = router;
