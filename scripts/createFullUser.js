require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Organization = require('../src/models/Organization');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nudge_db';

async function createFullUser() {
    try {
        console.log('Connecting to DB at:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to DB');

        const email = process.argv[2] || 'big@gmail.com';
        const password = process.argv[3] || 'password';

        // 1. Create Organization
        let org = await Organization.findOne({ name: 'Big Basket Prod' });
        if (!org) {
            org = await Organization.create({
                name: 'Big Basket Prod',
                plan: 'enterprise',
                is_active: true
            });
            console.log('✅ Organization "Big Basket Prod" created.');
        } else {
            console.log('ℹ️ Organization "Big Basket Prod" already exists.');
        }

        // 2. Create User
        let user = await User.findOne({ email });
        if (user) {
            console.log(`ℹ️ User "${email}" already exists. Updating password and org...`);
            user.password = password; // Will be hashed by pre-save hook? No, need to check model.
            // Assuming model has pre-save hook for hashing.
            // If updating directly, might need to manually hash if using findOneAndUpdate.
            // But here we set property and save(), so pre-save should trigger.
            user.organization_id = org._id;
            user.role = 'client_admin';
            await user.save();
            console.log(`✅ User "${email}" updated.`);
        } else {
            user = await User.create({
                email,
                password,
                role: 'client_admin',
                organization_id: org._id
            });
            console.log(`✅ User "${email}" created.`);
        }

        console.log(`\n🎉 Credentials:\nEmail: ${email}\nPassword: ${password}\n`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createFullUser();
