require('dotenv').config();
const mongoose = require('mongoose');
const Organization = require('../src/models/Organization');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nudge_db';

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to DB');

        const orgName = process.argv[2] || 'BigBasket';

        // Check if exists
        let org = await Organization.findOne({ name: orgName });

        if (org) {
            console.log(`⚠️ Organization "${orgName}" already exists.`);
            console.log(`🔑 API Key: ${org.api_key}`);
        } else {
            org = await Organization.create({ name: orgName });
            console.log(`🎉 Organization "${orgName}" created!`);
            console.log(`🔑 API Key: ${org.api_key}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

seed();
