const mongoose = require('mongoose');
require('dotenv').config();

const Nudge = require('../src/models/Nudge');

const inspectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const campaigns = await Nudge.find().sort({ createdAt: -1 });

        console.log(`Found ${campaigns.length} Campaigns:\n`);

        campaigns.forEach(c => {
            console.log('------------------------------------------------');
            console.log(`ID: ${c._id}`);
            console.log(`Name: ${c.campaign_name}`);
            console.log(`Status: ${c.status}`);
            console.log(`Trigger Screen: ${c.trigger_screen}`);
            console.log(`Created At: ${c.createdAt}`);
            console.log(`Layers: ${c.layers?.length || 0}`);
            console.log('------------------------------------------------\n');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

inspectDb();
