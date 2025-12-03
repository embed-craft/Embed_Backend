const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all admin routes
router.use(authMiddleware);

// Middleware to ensure Super Admin
const requireSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'super_admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access Denied: Super Admin only' });
    }
};

router.use(requireSuperAdmin);

router.post('/client', adminController.createClient);
router.get('/clients', adminController.getAllClients);
router.patch('/client/:orgId/contract', adminController.updateContract);
router.get('/stats', adminController.getGlobalStats);

module.exports = router;
