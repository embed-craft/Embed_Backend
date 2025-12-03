const axios = require('axios');
const mongoose = require('mongoose');
const EventLog = require('../src/models/EventLog');
require('dotenv').config();

const API_URL = 'http://localhost:4000/api';
const NUDGE_API_URL = 'http://localhost:4000/api/v1/nudge';

// Use the credentials of the client we just created (or create a new one if needed)
// Assuming the user created 'BigBasket' with 'big@gmail.com' / 'password123'
// If that failed, we will use the one created by testCreateClient.js if we can find it, 
// but let's try to create a fresh one to be sure.

async function testClientFlow() {
    try {
        // --- STEP 0: Setup (Connect to DB for verification) ---
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nudge_db');
        console.log('✅ Connected to DB for verification');

        // --- STEP 1: Create a NEW Client (via Super Admin) ---
        console.log('\n--- 1. Creating New Client ---');
        // Login as Super Admin first
        const adminLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@nudge.com',
            password: 'password123'
        });
        const adminToken = adminLogin.data.token;

        const uniqueId = Date.now();
        const clientEmail = `client_${uniqueId}@test.com`;
        const clientPass = 'password123';

        const createClientRes = await axios.post(`${API_URL}/admin/client`, {
            name: `Test Client ${uniqueId}`,
            adminEmail: clientEmail,
            password: clientPass
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        console.log(`✅ Client Created: ${clientEmail}`);

        // --- STEP 2: Login as Client ---
        console.log('\n--- 2. Logging in as Client ---');
        const clientLogin = await axios.post(`${API_URL}/auth/login`, {
            email: clientEmail,
            password: clientPass
        });

        const clientToken = clientLogin.data.token;
        const apiKey = clientLogin.data.user.organization.api_key;
        const orgId = clientLogin.data.user.organization._id;

        console.log('✅ Client Login Successful');
        console.log(`🔑 API Key: ${apiKey}`);
        console.log(`🏢 Org ID: ${orgId}`);

        // --- STEP 3: Create a Nudge (as Client) ---
        console.log('\n--- 3. Creating Nudge ---');
        const nudgeData = {
            nudge_id: `nudge_${Date.now()}`,
            campaign_name: 'Welcome Campaign',
            content: { title: 'Welcome!', body: 'Thanks for joining.' },
            trigger_screen: 'home',
            status: 'active'
        };

        // Note: createNudge is currently on /admin/nudge (protected by JWT)
        // We need to check if the route is /api/admin/nudge or /admin/nudge
        // Looking at index.js: app.use('/', nudgeRoutes);
        // nudgeRoutes has router.post('/admin/nudge', ...)
        // So it is http://localhost:4000/admin/nudge

        const createNudgeRes = await axios.post(`http://localhost:4000/admin/nudge`, nudgeData, {
            headers: { Authorization: `Bearer ${clientToken}` }
        });

        const nudgeId = createNudgeRes.data.data._id;
        console.log(`✅ Nudge Created: ${nudgeId}`);

        // --- STEP 4: Fetch Nudge (as End User via SDK) ---
        console.log('\n--- 4. Fetching Nudge (SDK) ---');
        // This uses x-api-key header
        const fetchRes = await axios.get(`${NUDGE_API_URL}/fetch`, {
            params: { userId: 'user_123', screenName: 'home', platform: 'ios' },
            headers: { 'x-api-key': apiKey }
        });

        if (fetchRes.data.data && fetchRes.data.data._id === nudgeId) {
            console.log('✅ Nudge Fetched Successfully');
        } else {
            console.error('❌ Failed to fetch nudge:', fetchRes.data);
        }

        // --- STEP 5: Track Event (as End User via SDK) ---
        console.log('\n--- 5. Tracking Event (SDK) ---');
        await axios.post(`${NUDGE_API_URL}/track`, {
            nudgeId: nudgeId,
            userId: 'user_123',
            action: 'view',
            metadata: { device: 'iPhone 13' }
        }, {
            headers: { 'x-api-key': apiKey }
        });

        console.log('✅ Event Tracked (API responded success)');

        // --- STEP 6: Verify Event in DB ---
        console.log('\n--- 6. Verifying DB Storage ---');
        // Wait a bit for async DB write (though currently it's awaited in controller)
        await new Promise(r => setTimeout(r, 1000));

        const event = await EventLog.findOne({
            nudge_id: nudgeId,
            user_id: 'user_123',
            event_type: 'view'
        });

        if (event) {
            console.log('✅ Event FOUND in Database!');
            console.log('Event Details:', {
                id: event._id,
                orgId: event.organization_id,
                type: event.event_type
            });

            if (event.organization_id.toString() === orgId) {
                console.log('✅ Organization ID matches!');
            } else {
                console.error('❌ Organization ID Mismatch!');
            }
        } else {
            console.error('❌ Event NOT found in Database.');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    } finally {
        await mongoose.disconnect();
    }
}

testClientFlow();
