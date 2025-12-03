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
}

module.exports = new AnalyticsController();
