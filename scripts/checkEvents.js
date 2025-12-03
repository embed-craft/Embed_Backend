require('dotenv').config();
const mongoose = require('mongoose');
const EventLog = require('../src/models/EventLog');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nudge_db';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        try {
            const count = await EventLog.countDocuments();
            console.log(`📊 Total EventLogs: ${count}`);

            if (count > 0) {
                const logs = await EventLog.find().sort({ timestamp: -1 }).limit(5);
                console.log('Recent Events:', JSON.stringify(logs, null, 2));
            }
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
