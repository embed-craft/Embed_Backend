const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const apiKeyMiddleware = require('../middleware/authMiddleware');

router.use(apiKeyMiddleware);

router.get('/admin/templates', templateController.listTemplates);
router.post('/admin/templates', templateController.createTemplate);
router.delete('/admin/templates/:id', templateController.deleteTemplate);

module.exports = router;
