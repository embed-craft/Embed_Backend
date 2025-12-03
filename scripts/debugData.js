require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const EventLog = require('../src/models/EventLog');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nudge_db';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        try {
            // 1. Get Admin Org ID
            const admin = await User.findOne({ email: 'admin@nudge.com' }).populate('organization_id');
            if (!admin) {
                console.log('❌ Admin not found');
                return;
            }
            const adminOrgId = admin.organization_id._id.toString();
            console.log(`👤 Admin Email: ${admin.email}`);
            console.log(`🏢 Admin Org ID: ${adminOrgId}`);

            // 2. Get Recent Events
            const logs = await EventLog.find().sort({ timestamp: -1 }).limit(5).lean();
            console.log(`📊 Found ${logs.length} recent events`);

            logs.forEach(log => {
                const logOrgId = log.organization_id.toString();
                const match = logOrgId === adminOrgId ? '✅ MATCH' : '❌ MISMATCH';
                console.log(`[${match}] Event: ${log.event_type} | OrgID: ${logOrgId} | User: ${log.user_id}`);
            });

        } catch (err) {
            console.error('❌ Error:', err);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    });
