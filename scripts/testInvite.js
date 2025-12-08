
const mongoose = require('mongoose');
const User = require('../src/models/User');

// Mock request
const req = {
    body: {
        email: 'test' + Date.now() + '@example.com',
        role: 'editor',
        name: 'Test Agent'
    },
    orgId: new mongoose.Types.ObjectId(), // Simulate valid ID
    user: { id: 'mock-admin-id' }
};

const res = {
    status: (code) => ({
        json: (data) => console.log(`Response [${code}]:`, data)
    })
};

async function test() {
    try {
        await mongoose.connect('mongodb://localhost:27017/nudge-db'); // Adjust URI if needed
        console.log('Connected to DB');

        // Inline the logic from inviteMember to trace it
        const { email, role } = req.body;
        console.log('Checking existing user...');
        let user = await User.findOne({ email });
        if (user) {
            console.log('User exists');
            return;
        }

        console.log('Creating user...');
        user = await User.create({
            name: req.body.name,
            email,
            password: '1234',
            role: role || 'editor',
            organization_id: req.orgId
        });
        console.log('User created:', user._id);

    } catch (error) {
        console.error('Test Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

test();
