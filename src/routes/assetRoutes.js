const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const assetController = require('../controllers/assetController');
const apiKeyMiddleware = require('../middleware/authMiddleware');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Unique filename: timestamp-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedOriginalName = file.originalname.replace(/\s+/g, '-');
        cb(null, uniqueSuffix + '-' + sanitizedOriginalName);
    }
});

const upload = multer({ storage: storage });

// Apply Middleware
router.use(apiKeyMiddleware);

// Routes
router.get('/', assetController.listAssets);
router.post('/', upload.single('file'), assetController.uploadAsset);
router.post('/url', assetController.createAssetFromUrl);
router.delete('/:id', assetController.deleteAsset);

module.exports = router;
