const Nudge = require('../models/Nudge');
const EventLog = require('../models/EventLog');
const cacheService = require('../services/cacheService');

class NudgeController {

    /**
     * High-scale fetch endpoint
     * GET /api/v1/nudge/fetch?userId=...&screenName=...&platform=...
     */
    async fetchNudge(req, res) {
        try {
            const { userId, screenName, platform } = req.query;
            const orgId = req.orgId; // From Middleware

            if (!screenName) {
                return res.status(400).json({ error: 'screenName is required' });
            }

            // 1. Try Cache First (Cache Key now includes OrgID to prevent mixup)
            const cacheKey = `${orgId}:${screenName}`;
            let nudges = await cacheService.getNudges(cacheKey);

            // 2. If Cache Miss, Fetch from DB
            if (!nudges) {
                try {
                    nudges = await Nudge.find({
                        organization_id: orgId,
                        status: 'active',
                        trigger_screen: { $in: [screenName, 'all'] }
                    }).sort({ priority: -1 }).lean();

                    // 3. Update Cache (Async)
                    if (nudges) {
                        cacheService.setNudges(cacheKey, nudges);
                    }
                } catch (dbError) {
                    console.error('DB Error:', dbError.message);
                    // Silent fail: If DB is down, nudges remains null/empty
                    nudges = [];
                }
            }

            // 2.5 Fetch User Profile for Targeting
            const EndUser = require('../models/EndUser');
            const userProfile = await EndUser.findOne({ organization_id: orgId, user_id: userId }).lean();
            const userProperties = userProfile ? { ...userProfile.properties, ...userProfile } : {};

            // 3. Filter Logic (In-Memory)
            // Filter by platform/target_audience AND complex targeting rules
            const matchedNudge = (nudges || []).find(nudge => {
                // A. Platform Check
                if (nudge.target_audience && nudge.target_audience.length > 0) {
                    if (platform && !nudge.target_audience.includes(platform.toLowerCase())) return false;
                }

                // B. Complex Targeting Rules
                if (nudge.targeting && nudge.targeting.length > 0) {
                    const allRulesPassed = nudge.targeting.every(rule => {
                        // Handle Group Logic (AND/OR) - simplified for now, assuming top-level is AND
                        if (rule.type === 'group') {
                            // TODO: Recursive group evaluation
                            return true;
                        }

                        // Handle User Property Rules
                        if (rule.type === 'user_property') {
                            const userValue = userProperties[rule.property];
                            const targetValue = rule.value;

                            switch (rule.operator) {
                                case 'equals': return userValue == targetValue;
                                case 'not_equals': return userValue != targetValue;
                                case 'greater_than': return Number(userValue) > Number(targetValue);
                                case 'less_than': return Number(userValue) < Number(targetValue);
                                case 'contains': return String(userValue).includes(String(targetValue));
                                case 'not_contains': return !String(userValue).includes(String(targetValue));
                                case 'set': return userValue !== undefined && userValue !== null;
                                case 'not_set': return userValue === undefined || userValue === null;
                                default: return true;
                            }
                        }
                        return true;
                    });

                    if (!allRulesPassed) return false;
                }

                return true;
            });

            // 4. Return Response
            return res.json({ data: matchedNudge || null });

        } catch (error) {
            console.error('Critical Error in fetchNudge:', error);
            // Silent Fail Policy: Always return 200 OK with null data
            return res.json({ data: null });
        }
    }
    async createNudge(req, res) {
        try {
            const orgId = req.orgId; // From Middleware

            const nudge = await Nudge.create({
                ...req.body,
                organization_id: orgId
            });

            // Invalidate Cache (Key includes OrgID)
            const cacheKey = `${orgId}:${nudge.trigger_screen}`;
            await cacheService.invalidateCache(cacheKey);

            res.status(201).json({ data: nudge });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async trackEvent(req, res) {
        try {
            // Support SDK aliases: event -> action, properties -> metadata
            let { action, metadata, userId, event, properties } = req.body;
            const orgId = req.orgId;

            // Normalize inputs
            action = action || event;
            metadata = metadata || properties || {};

            if (!action) {
                return res.status(400).json({ error: 'Action/Event is required' });
            }

            // A. Log Event
            await EventLog.create({
                event_type: action,
                metadata,
                user_id: userId,
                organization_id: orgId
            });

            // B. Auto-Discovery of Events & Properties
            const Event = require('../models/Event');
            const Property = require('../models/Property');

            // B1. Find or Create Event
            let eventDoc = await Event.findOne({ name: action, organization_id: orgId });
            if (!eventDoc) {
                eventDoc = await Event.create({
                    name: action,
                    displayName: action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    source: 'sdk_autodetected',
                    category: 'General',
                    validationLevel: 'none', // Allow all properties
                    organization_id: orgId,
                    properties: []
                });
                console.log(`[Auto-Discovery] New Event Discovered: ${action}`);
            }

            // B2. Discover Properties from Metadata
            if (metadata && Object.keys(metadata).length > 0) {
                const existingProps = await Property.find({ organization_id: orgId }).select('name _id').lean();
                const existingPropMap = new Map(existingProps.map(p => [p.name, p._id]));

                const newPropIds = [];

                for (const [key, value] of Object.entries(metadata)) {
                    let propId = existingPropMap.get(key);

                    if (!propId) {
                        // Create new Property
                        let type = 'string';
                        if (typeof value === 'number') type = 'number';
                        if (typeof value === 'boolean') type = 'boolean';

                        const newProp = await Property.create({
                            name: key,
                            displayName: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
                            type,
                            organization_id: orgId,
                            description: 'Auto-discovered from SDK'
                        });
                        propId = newProp._id;
                        existingPropMap.set(key, propId); // Add to map to avoid duplicates in same loop
                        console.log(`[Auto-Discovery] New Property Discovered: ${key}`);
                    }

                    newPropIds.push(propId);
                }

                // B3. Link Properties to Event (if not already linked)
                // We use $addToSet to avoid duplicates
                if (newPropIds.length > 0) {
                    await Event.updateOne(
                        { _id: eventDoc._id },
                        { $addToSet: { properties: { $each: newPropIds } } }
                    );
                }
            }

            // C. Update Nudge Stats (if applicable)
            // Check if metadata contains nudgeId/campaignId and action maps to a stat
            const nudgeId = metadata?.nudgeId || metadata?.campaignId;
            if (nudgeId) {
                const update = {};
                if (action === 'impression' || action.includes('impression')) {
                    update['stats.impressions'] = 1;
                } else if (action === 'click' || action.includes('click')) {
                    update['stats.clicks'] = 1;
                } else if (action === 'conversion' || action.includes('conversion')) {
                    update['stats.conversions'] = 1;
                }

                if (Object.keys(update).length > 0) {
                    await Nudge.updateOne(
                        {
                            $or: [{ _id: nudgeId }, { nudge_id: nudgeId }],
                            organization_id: orgId
                        },
                        { $inc: update }
                    );
                }
            }

            res.json({ success: true, message: 'Event tracked and processed' });

        } catch (error) {
            console.error('Track Event Error:', error);
            res.status(500).json({ error: error.message, stack: error.stack });
        }
    }

    /**
     * Identify User
     * POST /api/v1/nudge/identify
     */
    async identifyUser(req, res) {
        try {
            const { userId, traits, referralCode } = req.body;
            const orgId = req.orgId;

            if (!userId) {
                return res.status(400).json({ error: 'userId is required' });
            }

            // 1. Auto-Discover Properties
            if (traits) {
                const Property = require('../models/Property');
                const existingProps = await Property.find({ organization_id: orgId }).select('name').lean();
                const existingPropNames = new Set(existingProps.map(p => p.name));

                const newProps = [];
                for (const [key, value] of Object.entries(traits)) {
                    if (!existingPropNames.has(key)) {
                        // Infer type
                        let type = 'string';
                        if (typeof value === 'number') type = 'number';
                        if (typeof value === 'boolean') type = 'boolean';

                        newProps.push({
                            name: key,
                            displayName: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
                            type,
                            organization_id: orgId,
                            description: 'Auto-discovered from SDK'
                        });
                        existingPropNames.add(key); // Prevent duplicates in this loop
                    }
                }

                if (newProps.length > 0) {
                    await Property.insertMany(newProps);
                    console.log(`[Auto-Discovery] Added ${newProps.length} new properties for Org ${orgId}`);
                }
            }

            // 2. Check for Lead Conversion
            const Lead = require('../models/Lead');
            const lead = await Lead.findOne({ organization_id: orgId, externalId: userId, status: 'pending' });
            if (lead) {
                lead.status = 'converted';
                lead.convertedAt = new Date();
                await lead.save();
                console.log(`[Lead Conversion] Lead ${userId} converted! Referred by ${lead.referredBy}`);
            }

            // 3. Upsert User
            const EndUser = require('../models/EndUser');
            const updateData = {
                name: traits?.name,
                email: traits?.email,
                phone: traits?.phone,
                properties: traits || {},
                last_seen: new Date(),
                device: traits?.device
            };

            if (referralCode) updateData.referralCode = referralCode;

            const user = await EndUser.findOneAndUpdate(
                { organization_id: orgId, user_id: userId },
                {
                    $set: updateData,
                    $inc: { sessions_count: 1 }
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            res.json({ success: true, userId: user.user_id });
        } catch (error) {
            console.error('Identify Error:', error);
            res.status(500).json({ error: 'Failed to identify user' });
        }
    }

    /**
     * Add Leads (Referral System)
     * POST /api/v1/nudge/leads
     */
    async addLeads(req, res) {
        try {
            const { leads } = req.body; // Expecting array of leads
            const orgId = req.orgId;

            if (!leads || !Array.isArray(leads)) {
                return res.status(400).json({ error: 'leads array is required' });
            }

            const Lead = require('../models/Lead');
            const results = [];

            for (const leadData of leads) {
                try {
                    const lead = await Lead.findOneAndUpdate(
                        { organization_id: orgId, externalId: leadData.externalId },
                        {
                            name: leadData.name,
                            email: leadData.email,
                            phone: leadData.phoneNumber,
                            referredBy: leadData.properties?.referredBy,
                            referralSource: leadData.properties?.referralSource,
                            properties: leadData.properties,
                            status: 'pending'
                        },
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );
                    results.push({ id: lead.externalId, status: 'success' });
                } catch (err) {
                    results.push({ id: leadData.externalId, status: 'error', error: err.message });
                }
            }

            res.json({ results });
        } catch (error) {
            console.error('Add Leads Error:', error);
            res.status(500).json({ error: 'Failed to add leads' });
        }
    }

    /**
     * Get User Details
     * GET /api/v1/nudge/user
     */
    async getUserDetails(req, res) {
        try {
            const { userId } = req.query;
            const orgId = req.orgId;

            if (!userId) {
                return res.status(400).json({ error: 'userId is required' });
            }

            const EndUser = require('../models/EndUser');
            const EventLog = require('../models/EventLog');

            const [user, events] = await Promise.all([
                EndUser.findOne({ organization_id: orgId, user_id: userId }).lean(),
                EventLog.find({ organization_id: orgId, user_id: userId })
                    .sort({ timestamp: -1 })
                    .limit(50)
                    .lean()
            ]);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ user, events });
        } catch (error) {
            console.error('Get User Details Error:', error);
            res.status(500).json({ error: 'Failed to fetch user details' });
        }
    }
}

module.exports = new NudgeController();
