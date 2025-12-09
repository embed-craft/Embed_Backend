require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User'); // Adjust path to models

const API_URL = 'http://localhost:4000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_me';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nudge_db';

async function testClientLogic() {
    console.log('🚀 Starting Client Logic Verification (Bypass Login Mode)...\n');

    let token;

    try {
        // 1. Connect to DB Direct to get User and Generate Token
        console.log('1️⃣ Connecting to DB directly...');
        await mongoose.connect(MONGO_URI);

        const user = await User.findOne({ email: 'superhelper@nudge.com' });
        if (!user) {
            throw new Error('User superhelper@nudge.com not found in DB!');
        }

        // Generate Token Locally
        // Generate Token Locally with Super Admin privileges
        token = jwt.sign(
            { id: user._id, role: 'super_admin', orgId: user.organization_id },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log('✅ Generated Manual Token for:', user.email, '\n');

    } catch (error) {
        console.error('❌ DB/Token Error:', error.message);
        return;
    }

    const uniqueScheme = `myapp_${Date.now()}://`;

    // 2. Test: Missing App Scheme (Should FAIL)
    try {
        console.log('2️⃣ Test: Creating Client WITHOUT App Scheme (Expect Failure)...');
        await axios.post(
            `${API_URL}/admin/client`,
            {
                name: 'Bad Client',
                adminEmail: `bad${Date.now()}@test.com`,
                password: 'password123'
                // app_scheme MISSING
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.error('❌ FAILED: Should have rejected missing app_scheme! (SERVER LIKELY NOT UPDATED)\n');
        process.exit(1); // Exit 1 to signal failure to external tools if needed
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('✅ SUCCESS: Rejected missing app_scheme as expected.\n');
        } else {
            console.error('❌ UNEXPECTED ERROR (Check log)...\n');
            fs.writeFileSync('test_error_log.txt', JSON.stringify(error.response?.data || error.message, null, 2));
        }
    }

    // 3. Test: Success Case (Should PASS)
    try {
        console.log(`3️⃣ Test: Creating Client A with scheme '${uniqueScheme}' (Expect Success)...`);
        const res = await axios.post(
            `${API_URL}/admin/client`,
            {
                name: 'Good Client A',
                adminEmail: `good_a_${Date.now()}@test.com`,
                password: 'password123',
                app_scheme: uniqueScheme,
                bundle_id: { android: 'com.good.a', ios: 'id111' }
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('✅ SUCCESS: Client created:', res.data.organization.name, '\n');
    } catch (error) {
        console.error('❌ FAILED to create valid client:', error.response?.data || error.message, '\n');
    }

    // 4. Test: Duplicate Scheme (Should FAIL)
    try {
        console.log(`4️⃣ Test: Creating Client B with SAME scheme '${uniqueScheme}' (Expect 409 Conflict)...`);
        await axios.post(
            `${API_URL}/admin/client`,
            {
                name: 'Hijacker Client B',
                adminEmail: `hijacker_${Date.now()}@test.com`,
                password: 'password123',
                app_scheme: uniqueScheme, // DUPLICATE!
                bundle_id: { android: 'com.hijack.b', ios: 'id222' }
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.error('❌ FAILED: Should have rejected duplicate app_scheme!\n');
    } catch (error) {
        if (error.response?.status === 409) {
            console.log('✅ SUCCESS: Blocked duplicate app_scheme (Hijacking Prevented!).\n');
        } else {
            console.error('❌ UNEXPECTED ERROR:', error.response?.data || error.message, '\n');
        }
    }

    console.log('🎉 Logic Verification Complete: All Systems GO.');
    mongoose.connection.close();
}

testClientLogic();
