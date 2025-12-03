require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

const email = 'admin@nudge.com';
const password = 'Sinister@123';

async function debugLogin() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            console.log('User NOT FOUND:', email);
            return;
        }

        console.log('User Found:', JSON.stringify(user, null, 2));

        if (!user.password) {
            console.error('ERROR: User has NO password field!');
            return;
        }

        console.log('Attempting bcrypt compare...');
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password Match Result:', isMatch);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugLogin();
