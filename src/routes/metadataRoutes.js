const express = require('express');
const router = express.Router();
const metadataController = require('../controllers/metadataController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all metadata routes
router.use(authMiddleware);

// Events
router.get('/events', metadataController.getEvents);
router.post('/events', metadataController.createEvent);
router.put('/events/:id', metadataController.updateEvent);
router.delete('/events/:id', metadataController.deleteEvent);

// Properties
router.get('/properties', metadataController.getProperties);
router.post('/properties', metadataController.createProperty);
router.put('/properties/:id', metadataController.updateProperty);
router.delete('/properties/:id', metadataController.deleteProperty);

module.exports = router;
