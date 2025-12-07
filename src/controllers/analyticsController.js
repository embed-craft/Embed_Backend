const Nudge = require('../models/Nudge');
const EventLog = require('../models/EventLog');

class AnalyticsController {

    /**
     * Get Dashboard Stats
     * GET /admin/analytics/dashboard
     */
    async getDashboardStats(req, res) {
        try {
            const orgId = req.orgId;

            // 1. Active Campaigns Count
            const activeCampaignsCount = await Nudge.countDocuments({
                organization_id: orgId,
                status: 'active'
            });

            // 2. Aggregate Total Impressions, Clicks, Conversions from Nudge Config/Stats
            // Note: Ideally, we should aggregate from EventLogs, but for now we can sum up the counters on Nudge models
            // if we are updating them. If not, we should aggregate EventLogs.
            // Let's aggregate from EventLogs for accuracy if possible, or fallback to Nudge counters.

            // Aggregation Pipeline for EventLogs (Last 30 Days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const stats = await EventLog.aggregate([
                {
                    $match: {
                        organization_id: orgId,
                        timestamp: { $gte: thirtyDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: null,
                        impressions: {
                            $sum: { $cond: [{ $eq: ["$event_type", "impression"] }, 1, 0] }
                        },
                        clicks: {
                            $sum: { $cond: [{ $eq: ["$event_type", "click"] }, 1, 0] }
                        },
                        conversions: {
                            $sum: { $cond: [{ $eq: ["$event_type", "conversion"] }, 1, 0] }
                        }
                    }
                }
            ]);

            const totalStats = stats[0] || { impressions: 0, clicks: 0, conversions: 0 };

            // 3. Daily Stats for Charts (Last 7 Days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const dailyStats = await EventLog.aggregate([
                {
                    $match: {
                        organization_id: orgId,
                        timestamp: { $gte: sevenDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                        impressions: {
                            $sum: { $cond: [{ $eq: ["$event_type", "impression"] }, 1, 0] }
                        },
                        clicks: {
                            $sum: { $cond: [{ $eq: ["$event_type", "click"] }, 1, 0] }
                        },
                        conversions: {
                            $sum: { $cond: [{ $eq: ["$event_type", "conversion"] }, 1, 0] }
                        }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Fill in missing days
            const filledDailyStats = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

                const found = dailyStats.find(s => s._id === dateStr);
                filledDailyStats.push({
                    date: dayName,
                    fullDate: dateStr,
                    impressions: found ? found.impressions : 0,
                    clicks: found ? found.clicks : 0,
                    conversions: found ? found.conversions : 0
                });
            }

            res.json({
                activeCampaigns: activeCampaignsCount,
                totals: totalStats,
                daily: filledDailyStats
            });

        } catch (error) {
            console.error('Dashboard Stats Error:', error);
            res.status(500).json({ error: 'Failed to fetch dashboard stats' });
        }
    }

    /**
     * List Users
     * GET /api/v1/admin/analytics/users
     */
    async getUsers(req, res) {
        try {
            const orgId = req.orgId;
            const { limit = 50, offset = 0 } = req.query;
            const EndUser = require('../models/EndUser');

            const users = await EndUser.find({ organization_id: orgId })
                .sort({ last_seen: -1 })
                .skip(Number(offset))
                .limit(Number(limit))
                .lean();

            const total = await EndUser.countDocuments({ organization_id: orgId });

            res.json({ users, total });
        } catch (error) {
            console.error('Get Users Error:', error);
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    }

    /**
     * Get User Details
     * GET /api/v1/admin/analytics/users/:userId
     */
    async getUserDetails(req, res) {
        try {
            const { userId } = req.params;
            const { limit = 50, offset = 0 } = req.query;
            const orgId = req.orgId;
            const EndUser = require('../models/EndUser');
            const EventLog = require('../models/EventLog');

            const [user, events, totalEvents] = await Promise.all([
                EndUser.findOne({ organization_id: orgId, user_id: userId }).lean(),
                EventLog.find({ organization_id: orgId, user_id: userId })
                    .sort({ timestamp: -1 })
                    .skip(Number(offset))
                    .limit(Number(limit))
                    .lean(),
                EventLog.countDocuments({ organization_id: orgId, user_id: userId })
            ]);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ user, events, totalEvents });
        } catch (error) {
            console.error('Get User Details Error:', error);
            res.status(500).json({ error: 'Failed to fetch user details' });
        }
    }
    /**
     * Get Campaign Stats
     * GET /api/v1/admin/analytics/campaign/:campaignId
     */
    async getCampaignStats(req, res) {
        try {
            const { campaignId } = req.params;
            const orgId = req.orgId; // Assuming auth middleware sets this
            const EventLog = require('../models/EventLog');
            const Nudge = require('../models/Nudge'); // Assuming Campaign model is Nudge

            // 1. Fetch Campaign Details
            const campaign = await Nudge.findOne({ _id: campaignId, organization_id: orgId }).lean();
            if (!campaign) {
                return res.status(404).json({ error: 'Campaign not found' });
            }

            // 2. Aggregate Overall Stats (Impressions, Clicks, Conversions)
            const stats = await EventLog.aggregate([
                {
                    $match: {
                        nudge_id: campaignId,
                        organization_id: orgId // Security check
                    }
                },
                {
                    $group: {
                        _id: null,
                        impressions: { $sum: { $cond: [{ $eq: ["$event_type", "impression"] }, 1, 0] } },
                        clicks: { $sum: { $cond: [{ $eq: ["$event_type", "click"] }, 1, 0] } },
                        conversions: { $sum: { $cond: [{ $eq: ["$event_type", "conversion"] }, 1, 0] } },
                        uniqueUsers: { $addToSet: "$user_id" }
                    }
                }
            ]);

            const overallStats = stats[0] || { impressions: 0, clicks: 0, conversions: 0, uniqueUsers: [] };
            const uniqueUserCount = overallStats.uniqueUsers ? overallStats.uniqueUsers.length : 0;


            // 3. User List (Who interacted)
            // Ideally we paginate this, but for a report we might want top 100 or all.
            // Let's get top 100 users sorted by activity count
            const topUsers = await EventLog.aggregate([
                { $match: { nudge_id: campaignId, organization_id: orgId } },
                { $group: { _id: "$user_id", eventCount: { $sum: 1 }, lastSeen: { $max: "$timestamp" } } },
                { $sort: { eventCount: -1 } },
                { $limit: 100 }
            ]);

            // 4. Event Metadata Breakdown (Top properties)
            // unwinding metadata is expensive, so we'll do a simplified grouping by event type
            const eventBreakdown = await EventLog.aggregate([
                { $match: { nudge_id: campaignId, organization_id: orgId } },
                { $group: { _id: "$event_type", count: { $sum: 1 } } }
            ]);

            res.json({
                campaign: {
                    id: campaign._id,
                    name: campaign.name,
                    status: campaign.status,
                    createdAt: campaign.createdAt
                },
                stats: {
                    impressions: overallStats.impressions,
                    clicks: overallStats.clicks,
                    conversions: overallStats.conversions,
                    uniqueUserCount: uniqueUserCount,
                    ctr: overallStats.impressions > 0 ? ((overallStats.clicks / overallStats.impressions) * 100).toFixed(2) : 0
                },
                users: topUsers.map(u => ({ userId: u._id, eventCount: u.eventCount, lastSeen: u.lastSeen })),
                events: eventBreakdown.map(e => ({ type: e._id, count: e.count }))
            });

        } catch (error) {
            console.error('Get Campaign Stats Error:', error);
            res.status(500).json({ error: 'Failed to fetch campaign stats' });
        }
    }
}

module.exports = new AnalyticsController();
