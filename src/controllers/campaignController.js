const Nudge = require('../models/Nudge');

// Create a new campaign
exports.createCampaign = async (req, res) => {
    try {
        console.log('Create Campaign Request Body:', JSON.stringify(req.body, null, 2));
        const { name, status, config, layers, trigger, screen, segments, schedule } = req.body;
        const orgId = req.orgId; // From authMiddleware
        console.log('Organization ID:', orgId);

        if (!orgId) {
            return res.status(400).json({ error: 'Organization ID missing from request' });
        }

        const newNudge = new Nudge({
            nudge_id: `nudge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            organization_id: orgId,
            campaign_name: name || 'Untitled Campaign',
            status: status || 'draft',
            experience: req.body.experience || 'nudges', // ✅ FIX: Save experience
            config: config || {},
            layers: layers || [],
            trigger_event: trigger?.event || trigger || 'session_start', // ✅ FIX: Handle string or object trigger
            trigger_screen: screen || 'all',
            targeting: req.body.targeting || [],
            segments: segments || [],
            tags: req.body.tags || [], // ✅ FIX: Save tags
            schedule: schedule || {}
        });

        await newNudge.save();
        console.log('Campaign Created Successfully:', newNudge._id);
        res.status(201).json(newNudge);
    } catch (error) {
        console.error('Create Campaign Error Details:', error);
        res.status(500).json({ error: `Failed to create campaign: ${error.message}`, details: error });
    }
};

// Get all campaigns for the organization
exports.getCampaigns = async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        const orgId = req.orgId;

        const campaigns = await Nudge.find({ organization_id: orgId })
            .sort({ createdAt: -1 })
            .skip(parseInt(offset))
            .limit(parseInt(limit));

        const total = await Nudge.countDocuments({ organization_id: orgId });

        res.json({ campaigns, total });
    } catch (error) {
        console.error('Get Campaigns Error:', error);
        res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
};

// Get a single campaign
exports.getCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const orgId = req.orgId;

        const campaign = await Nudge.findOne({ _id: id, organization_id: orgId });
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        console.log(`Get Campaign ${id}: Found. Layers count: ${campaign.layers?.length}`);
        if (campaign.layers?.length > 0) {
            console.log('First layer sample:', JSON.stringify(campaign.layers[0], null, 2));
        } else {
            console.log('WARNING: Campaign has no layers!');
        }

        res.json(campaign);
    } catch (error) {
        console.error('Get Campaign Error:', error);
        res.status(500).json({ error: 'Failed to fetch campaign' });
    }
};

// Update a campaign
exports.updateCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const orgId = req.orgId;

        // Map frontend fields to backend model if needed
        if (updates.name) updates.campaign_name = updates.name;
        if (updates.trigger) updates.trigger_event = updates.trigger.event || updates.trigger; // ✅ FIX: Handle string trigger
        if (updates.screen) updates.trigger_screen = updates.screen;
        // Ensure targeting is updated if provided
        if (updates.targeting) updates.targeting = updates.targeting;
        if (updates.tags) updates.tags = updates.tags; // ✅ FIX: Update tags
        if (updates.experience) updates.experience = updates.experience; // ✅ FIX: Update experience
        if (updates.status) updates.status = updates.status; // ✅ FIX: Update status

        const campaign = await Nudge.findOneAndUpdate(
            { _id: id, organization_id: orgId },
            updates,
            { new: true }
        );

        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        res.json(campaign);
    } catch (error) {
        console.error('Update Campaign Error:', error);
        res.status(500).json({ error: 'Failed to update campaign' });
    }
};

// Delete a campaign
exports.deleteCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const orgId = req.orgId;

        const campaign = await Nudge.findOneAndDelete({ _id: id, organization_id: orgId });

        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        res.json({ ok: true });
    } catch (error) {
        console.error('Delete Campaign Error:', error);
        res.status(500).json({ error: 'Failed to delete campaign' });
    }
};
