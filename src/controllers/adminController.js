const Organization = require('../models/Organization');
const User = require('../models/User');
const Nudge = require('../models/Nudge');
const EventLog = require('../models/EventLog');

class AdminController {

    /**
     * Create New Client (Organization + Admin User)
     * POST /api/admin/client
     */
    async createClient(req, res) {
        try {
            const { name, adminEmail, password, planLimit, contractEndDate, app_scheme, bundle_id } = req.body;

            // 1. Validation for App Identity
            if (!app_scheme) {
                return res.status(400).json({ error: 'App Scheme is required for Deep Linking (e.g., "myapp://")' });
            }

            // 2. Check Uniqueness (Manual check for clear error message)
            const existingOrg = await Organization.findOne({ app_scheme });
            if (existingOrg) {
                return res.status(409).json({ error: `App Scheme '${app_scheme}' is already in use by another client.` });
            }

            // 3. Create Organization
            const org = await Organization.create({
                name,
                admin_email: adminEmail,
                app_scheme,
                bundle_id: bundle_id || {}, // Default to empty object if not provided
                plan_limit: planLimit || 100000,
                contract_end_date: contractEndDate ? new Date(contractEndDate) : undefined
            });

            // 4. Create Admin User for this Org
            const user = await User.create({
                email: adminEmail,
                password, // Will be hashed by model
                role: 'client_admin',
                organization_id: org._id
            });

            res.status(201).json({
                message: 'Client created successfully',
                organization: org,
                user: { email: user.email, id: user._id }
            });

        } catch (error) {
            // Handle unique index error from MongoDB if race condition occurs
            if (error.code === 11000 && error.keyPattern && error.keyPattern.app_scheme) {
                return res.status(409).json({ error: `App Scheme is already in use.` });
            }
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Update Contract Details
     * PATCH /api/admin/client/:orgId/contract
     */
    async updateContract(req, res) {
        try {
            const { orgId } = req.params;
            const { contractEndDate, planLimit, status } = req.body;

            // Prepare update object
            const updateData = {};
            if (contractEndDate !== undefined) updateData.contract_end_date = contractEndDate ? new Date(contractEndDate) : undefined;
            if (planLimit !== undefined) updateData.plan_limit = planLimit;

            // Handle Status & Kill Switch Sync
            if (status) {
                updateData.status = status;
                updateData.is_active = status === 'active'; // Sync kill switch
            }

            const org = await Organization.findByIdAndUpdate(
                orgId,
                updateData,
                { new: true }
            );

            res.json({ message: 'Contract updated', organization: org });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get All Clients
     * GET /api/admin/clients
     */
    async getAllClients(req, res) {
        try {
            const clients = await Organization.find().sort({ createdAt: -1 });
            res.json(clients);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get Global Stats
     * GET /api/admin/stats
     */
    async getGlobalStats(req, res) {
        try {
            const totalOrgs = await Organization.countDocuments();
            const totalNudges = await Nudge.countDocuments();
            const totalEvents = await EventLog.countDocuments();

            res.json({
                totalOrgs,
                totalNudges,
                totalEvents
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new AdminController();
