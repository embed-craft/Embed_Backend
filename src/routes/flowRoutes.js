const express = require('express');
const router = express.Router();
const flowController = require('../controllers/flowController');
const apiKeyMiddleware = require('../middleware/authMiddleware');

router.use(apiKeyMiddleware);

router.get('/admin/flows', flowController.listFlows);
router.post('/admin/flows', flowController.createFlow);
router.delete('/admin/flows/:id', flowController.deleteFlow);

module.exports = router;
