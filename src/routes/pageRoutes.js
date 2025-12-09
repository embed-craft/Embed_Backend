const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure Multer for Memory Storage (to allow Sharp processing)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Dashboard Routes (Protected)
router.post('/session', authMiddleware, pageController.createSession);
router.get('/', authMiddleware, pageController.getPages);
router.get('/:id', authMiddleware, pageController.getPage);
router.delete('/:id', authMiddleware, pageController.deletePage); // Add delete support
router.get('/poll/:token', authMiddleware, pageController.pollSession);

// SDK Routes (Public/Token Protected inside controller)
// Note: We don't use the standard authMiddleware here because the SDK uses the JWT from the QR code
router.post('/upload', upload.single('screenshot'), pageController.uploadPage);

module.exports = router;
