const Organization = require('../models/Organization');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me';

const authMiddleware = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        const authHeader = req.headers['authorization'];

        // 1. API Key Strategy (SDK / Public API)
        if (apiKey) {
            const organization = await Organization.findOne({ api_key: apiKey, status: 'active' });
            if (!organization) {
                return res.status(403).json({ error: 'Invalid API Key' });
            }

            // Check Contract for SDK usage too
            if (organization.contract_end_date && new Date() > new Date(organization.contract_end_date)) {
                return res.status(403).json({ error: 'Contract Expired' });
            }

            req.orgId = organization._id;
            req.authType = 'api_key';
            return next();
        }

        // 2. JWT Strategy (Dashboard / Admin API)
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                req.user = decoded;
                req.orgId = decoded.orgId; // Attach OrgID from token
                req.authType = 'jwt';
                return next();
            } catch (err) {
                return res.status(401).json({ error: 'Invalid Token' });
            }
        }

        // 3. No Auth Provided
        return res.status(401).json({ error: 'Authentication required (API Key or Bearer Token)' });

    } catch (error) {
        console.error('Auth Middleware Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = authMiddleware;
