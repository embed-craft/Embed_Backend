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

exports.uploadPage = async (req, res) => {
    try {
        // 1. Validate Token (Header: Authorization: Bearer <token>)
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

        // 2. Validate API Key Org vs Token Org (Security Gap Fix)
        // In a real SDK flow, the API Key validation middleware runs first and attaches req.user/req.org
        // Here we assume req.sdk_client_org_id is set by authMiddleware (if using SDK endpoint logic)
        // For now, we trust the Signed Token as the primary source of truth for target Org.

        const organization_id = decoded.organization_id;

        // 3. Handle File Upload
        if (!req.file) {
            return res.status(400).json({ message: 'Screenshot image required' });
        }

        // 4. Image Compression (Performance Gap Fix)
        const filename = `page_${Date.now()}_${Math.round(Math.random() * 1000)}.jpg`;
        const filepath = path.join(uploadDir, filename);

        await sharp(req.file.buffer)
            .resize(1080, null, { withoutEnlargement: true }) // Limit width to 1080px
            .jpeg({ quality: 80 })
            .toFile(filepath);

        // 5. Parse Metadata
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

        // 6. Save Page (Atomic Write)
        const newPage = new Page({
            organization_id,
            name: name || pageTag,
            pageTag,
            imageUrl: `/uploads/pages/${filename}`,
            elements: parsedElements,
            deviceMetadata: parsedMetadata,
            sessionToken: token // To link back to dashboard polling
        });

        await newPage.save();

        res.status(201).json({ message: 'Page uploaded successfully', pageId: newPage._id });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Upload failed' });
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
