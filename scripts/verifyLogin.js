require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nudge_db';

async function verifyLogin() {
    try {
        console.log('Connecting to DB at:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to DB');

        const email = 'admin@nudge.com';
        const password = 'password123';

        console.log(`Checking user: ${email}`);
        const user = await User.findOne({ email });

        if (!user) {
            console.log('❌ User NOT found in database!');
        } else {
            console.log('✅ User found:', user.email);
            console.log('Stored Hashed Password:', user.password);

            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                console.log('✅ Password MATCHES!');
            } else {
                console.log('❌ Password does NOT match.');
                // Debugging hash
                const newHash = await bcrypt.hash(password, 10);
                console.log('Expected Hash for "password123":', newHash);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

verifyLogin();
