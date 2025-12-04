const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes
router.use(authMiddleware);

// Routes
router.get('/', teamController.getMembers);
router.post('/invite', teamController.inviteMember);
router.delete('/:id', teamController.removeMember);

module.exports = router;
