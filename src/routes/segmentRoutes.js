const express = require('express');
const router = express.Router();
const segmentController = require('../controllers/segmentController');
const apiKeyMiddleware = require('../middleware/authMiddleware');

router.use(apiKeyMiddleware);

router.get('/admin/segments', segmentController.listSegments);
router.post('/admin/segments', segmentController.createSegment);
router.delete('/admin/segments/:id', segmentController.deleteSegment);

module.exports = router;
