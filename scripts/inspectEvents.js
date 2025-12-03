require('dotenv').config();
const mongoose = require('mongoose');
const EventLog = require('../src/models/EventLog');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nudge_db';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        try {
            const logs = await EventLog.find().sort({ timestamp: -1 }).limit(5).lean();
            console.log('Recent Events Details:');
            logs.forEach(log => {
                console.log(`ID: ${log._id}`);
                console.log(`OrgID: ${log.organization_id}`);
                console.log(`Type: ${log.event_type}`);
                console.log(`User: ${log.user_id}`);
                console.log('---');
            });
        } catch (err) {
            console.error('❌ Error querying EventLogs:', err);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    });
