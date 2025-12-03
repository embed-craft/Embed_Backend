require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nudge_db';

async function seedSuperAdmin() {
    try {
        console.log('Connecting to DB at:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to DB');

        const email = process.argv[2];
        const password = process.argv[3];

        if (!email || !password) {
            console.log('Usage: node scripts/createSuperAdmin.js <email> <password>');
            process.exit(1);
        }

        // Check if exists
        let user = await User.findOne({ email });

        if (user) {
            console.log(`⚠️ User "${email}" already exists. Updating password...`);
            user.password = password;
            user.role = 'super_admin'; // Ensure role is correct
            await user.save();
            console.log(`✅ User "${email}" updated with new password!`);
        } else {
            user = await User.create({
                email,
                password,
                role: 'super_admin'
            });
            console.log(`🎉 Super Admin "${email}" created!`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

seedSuperAdmin();
