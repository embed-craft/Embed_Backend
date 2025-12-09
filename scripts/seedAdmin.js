require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Organization = require('../src/models/Organization');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nudge_db';

async function seedAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to DB');

        // 1. Ensure Organization
        let org = await Organization.findOne({ name: 'BigBasket' });
        if (!org) {
            org = await Organization.create({ name: 'BigBasket', app_scheme: 'bigbasket', bundle_id: 'com.bigbasket.details' });
            console.log('✅ Organization Created');
        } else {
            // Update existing org with scheme if missing
            if (!org.app_scheme) {
                org.app_scheme = 'bigbasket';
                org.bundle_id = 'com.bigbasket.details';
                await org.save();
                console.log('✅ Organization Updated with app_scheme');
            }
        }

        // 2. Ensure User
        const email = 'superhelper@nudge.com';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        let user = await User.findOne({ email });
        if (user) {
            user.password = hashedPassword;
            user.organization_id = org._id;
            await user.save();
            console.log('✅ User Updated');
        } else {
            user = await User.create({
                name: 'Super Helper',
                email,
                password: hashedPassword,
                role: 'super_admin',
                organization_id: org._id
            });
            console.log('✅ User Created');
        }

        console.log(`credentials: ${email} / ${password} / Org: ${org.name}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

seedAdmin();
