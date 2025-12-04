const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const apiKeyMiddleware = require('../middleware/authMiddleware');

console.log('🔄 Loading Template Routes...');

router.use(apiKeyMiddleware);

// Test route to verify router is working
router.get('/admin/templates/test', (req, res) => {
    res.json({ message: 'Template routes are working!' });
});

router.get('/admin/templates', templateController.listTemplates);
router.get('/admin/templates/:id', templateController.getTemplate);
router.post('/admin/templates', templateController.createTemplate);
router.put('/admin/templates/:id', templateController.updateTemplate);
router.delete('/admin/templates/:id', templateController.deleteTemplate);

console.log('✅ Template Routes Loaded Successfully');

module.exports = router;
