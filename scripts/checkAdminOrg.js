require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Organization = require('../src/models/Organization');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nudge_db';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        try {
            const admin = await User.findOne({ email: 'admin@nudge.com' }).populate('organization_id');
            if (admin) {
                console.log(`Admin Email: ${admin.email}`);
                console.log(`Admin Org ID: ${admin.organization_id._id}`);
                console.log(`Org Name: ${admin.organization_id.name}`);
            } else {
                console.log('Admin not found');
            }
        } catch (err) {
            console.error('❌ Error querying Admin:', err);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    });
