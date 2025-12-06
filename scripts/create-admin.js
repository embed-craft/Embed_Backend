require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const createAdmin = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI;
        if (!MONGO_URI) {
            console.error('❌ MONGO_URI is missing in .env');
            process.exit(1);
        }

        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const email = process.env.ADMIN_EMAIL || 'admin@example.com';
        const password = process.env.ADMIN_PASSWORD || 'admin123';

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('⚠️ Admin user already exists:', email);
            process.exit(0);
        }

        const user = await User.create({
            email,
            password,
            role: 'super_admin'
        });

        console.log('✅ Admin user created successfully:', user.email);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
