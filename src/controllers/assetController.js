const Asset = require('../models/Asset');
const fs = require('fs');
const path = require('path');

class AssetController {
    /**
     * Upload Asset
     * POST /api/v1/assets
     */
    async uploadAsset(req, res) {
        try {
            const orgId = req.orgId;
            const file = req.file;

            if (!file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const type = file.mimetype.startsWith('image/') ? 'image' : 'file';
            const size = (file.size / 1024).toFixed(1) + ' KB';
            // URL should be relative to server base, e.g. /uploads/filename
            const url = `/uploads/${file.filename}`;

            const asset = await Asset.create({
                name: file.originalname,
                type,
                url,
                size,
                organization_id: orgId
            });

            res.status(201).json(asset);
        } catch (error) {
            console.error('Upload Asset Error:', error);
            res.status(500).json({ error: 'Failed to upload asset' });
        }
    }

    /**
     * Create Asset from URL
     * POST /api/v1/assets/url
     */
    async createAssetFromUrl(req, res) {
        try {
            const orgId = req.orgId;
            const { name, url, type } = req.body;

            if (!url) {
                return res.status(400).json({ error: 'URL is required' });
            }

            // Auto-detect type if not provided
            let assetType = type;
            if (!assetType) {
                const lowerUrl = url.toLowerCase();
                if (lowerUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/) || lowerUrl.includes('images')) {
                    assetType = 'image';
                } else {
                    assetType = 'file';
                }
            }

            const asset = await Asset.create({
                name: name || url.split('/').pop() || 'Untitled Asset',
                type: assetType,
                url,
                size: 'External', // We don't know the size
                organization_id: orgId
            });

            res.status(201).json(asset);
        } catch (error) {
            console.error('Create Asset URL Error:', error);
            res.status(500).json({ error: 'Failed to create asset from URL' });
        }
    }

    /**
     * List Assets
     * GET /api/v1/assets
     */
    async listAssets(req, res) {
        try {
            const orgId = req.orgId;
            const assets = await Asset.find({ organization_id: orgId }).sort({ createdAt: -1 });
            res.json({ assets });
        } catch (error) {
            console.error('List Assets Error:', error);
            res.status(500).json({ error: 'Failed to list assets' });
        }
    }

    /**
     * Delete Asset
     * DELETE /api/v1/assets/:id
     */
    async deleteAsset(req, res) {
        try {
            const { id } = req.params;
            const orgId = req.orgId;

            const asset = await Asset.findOne({ _id: id, organization_id: orgId });
            if (!asset) {
                return res.status(404).json({ error: 'Asset not found' });
            }

            // Delete file from filesystem
            // Assuming url is /uploads/filename
            const filename = asset.url.split('/').pop();
            const filePath = path.join(__dirname, '../../uploads', filename);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            await Asset.deleteOne({ _id: id });
            res.json({ success: true, message: 'Asset deleted' });
        } catch (error) {
            console.error('Delete Asset Error:', error);
            res.status(500).json({ error: 'Failed to delete asset' });
        }
    }
}

module.exports = new AssetController();
