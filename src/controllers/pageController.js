const Page = require('../models/Page');
const jwt = require('jsonwebtoken');
const Organization = require('../models/Organization');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // For image compression

// Ensure uploads directory exists
const uploadDir = 'uploads/pages';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Security secret (In production, use ENV)
const JWT_SECRET = process.env.JWT_SECRET || 'nudge-secret-key-123';

exports.createSession = async (req, res) => {
    try {
        const organization_id = req.orgId;
        const org = await Organization.findById(organization_id);

        if (!org) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Generate a short-lived token (10 mins) for the QR code
        const token = jwt.sign(
            { organization_id, type: 'page_capture_session' },
            JWT_SECRET,
            { expiresIn: '10m' }
        );

        // Return the deep link scheme
        // e.g. bigbasket://capture?token=...
        const scheme = org.app_scheme || 'embeddedcraft'; // Fallback
        const deepLink = `${scheme}://capture?token=${token}`;

        res.json({
            token,
            deepLink,
            expiresIn: 600
        });
    } catch (error) {
        console.error('Session Create Error:', error);
        res.status(500).json({ message: 'Failed to create session' });
    }
};

const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.uploadPage = async (req, res) => {
    try {
        // 1. Validate Token
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: 'Missing token' });

        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        if (decoded.type !== 'page_capture_session') {
            return res.status(403).json({ message: 'Invalid token type' });
        }

        const organization_id = decoded.organization_id;

        // 2. Validate File
        if (!req.file) {
            return res.status(400).json({ message: 'Screenshot image required' });
        }

        // 3. Optimize & Upload to Cloudinary
        // Use Sharp to resize/compress first, then proper stream upload
        const optimizedBuffer = await sharp(req.file.buffer)
            .resize(1080, null, { withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();

        // Helper to upload stream to Cloudinary
        const uploadFromBuffer = (buffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'embeddedcraft/pages', // Organized folder
                        resource_type: 'image'
                    },
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                streamifier.createReadStream(buffer).pipe(stream);
            });
        };

        const result = await uploadFromBuffer(optimizedBuffer);
        const imageUrl = result.secure_url; // Verified Public URL

        // 4. Parse Metadata
        const {
            name,
            pageTag,
            elements,
            deviceMetadata
        } = req.body;

        let parsedElements = [];
        let parsedMetadata = {};

        try {
            parsedElements = typeof elements === 'string' ? JSON.parse(elements) : elements;
            parsedMetadata = typeof deviceMetadata === 'string' ? JSON.parse(deviceMetadata) : deviceMetadata;
        } catch (e) {
            return res.status(400).json({ message: 'Invalid JSON metadata' });
        }

        // 5. Save Page
        const newPage = new Page({
            organization_id,
            name: name || pageTag,
            pageTag,
            imageUrl: imageUrl, // Save full Cloudinary URL
            elements: parsedElements,
            deviceMetadata: parsedMetadata,
            sessionToken: token
        });

        await newPage.save();

        res.status(201).json({ message: 'Page uploaded successfully', pageId: newPage._id });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Upload failed: ' + error.message });
    }
};

exports.getPages = async (req, res) => {
    try {
        const organization_id = req.orgId;

        // Return latest pages first
        const pages = await Page.find({ organization_id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ pages });
    } catch (error) {
        console.error('Get Pages Error:', error);
        res.status(500).json({ message: 'Failed to fetch pages' });
    }
};

exports.getPage = async (req, res) => {
    try {
        const page = await Page.findById(req.params.id);
        if (!page) return res.status(404).json({ message: 'Page not found' });
        res.json(page);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deletePage = async (req, res) => {
    try {
        const page = await Page.findById(req.params.id);
        if (!page) return res.status(404).json({ message: 'Page not found' });

        // Optional: Delete the image file from disk to save space
        if (page.imageUrl) {
            const filePath = path.join(__dirname, '../../', page.imageUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await Page.findByIdAndDelete(req.params.id);
        res.json({ message: 'Page deleted successfully' });
    } catch (error) {
        console.error('Delete Page Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Polling Endpoint for Dashboard
exports.pollSession = async (req, res) => {
    try {
        const { token } = req.params;
        // Find latest page uploaded with this session token
        const page = await Page.findOne({ sessionToken: token }).sort({ createdAt: -1 });

        if (page) {
            return res.json({ status: 'completed', page });
        } else {
            return res.json({ status: 'waiting' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Polling error' });
    }
};
