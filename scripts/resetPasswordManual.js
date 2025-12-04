require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'aaup23cs@gmail.com';
        const newPassword = 'password123';

        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found:', email);
            process.exit(1);
        }

        user.password = newPassword;
        await user.save(); // Triggers pre-save hash

        console.log(`Password for ${email} has been reset to: ${newPassword}`);
        process.exit(0);
    } catch (error) {
        console.error('Error resetting password:', error);
        process.exit(1);
    }
};

resetPassword();
