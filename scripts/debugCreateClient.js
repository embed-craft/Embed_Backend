require('dotenv').config();
const mongoose = require('mongoose');
const Organization = require('../src/models/Organization');
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nudge_db';

async function debugCreateClient() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected');

        const name = 'Test Client ' + Date.now();
        const adminEmail = 'client' + Date.now() + '@test.com';
        const password = 'password123';

        console.log(`Creating client: ${name}, ${adminEmail}`);

        // 1. Create Organization
        const org = await Organization.create({
            name,
            admin_email: adminEmail,
            plan_limit: 100000
        });
        console.log('✅ Organization created:', org._id);

        // 2. Create Admin User
        const user = await User.create({
            email: adminEmail,
            password,
            role: 'client_admin',
            organization_id: org._id
        });
        console.log('✅ User created:', user._id);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating client:', error);
        process.exit(1);
    }
}

debugCreateClient();
