const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const API_URL = 'http://localhost:4000';

async function testPageFeature() {
    try {
        console.log('1. Logging in...');
        // Login to get token (Simulating Dashboard Admin)
        const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
            email: 'superhelper@nudge.com',
            password: 'password123'
        });
        const adminToken = loginRes.data.token;
        console.log('✅ Logged in');

        console.log('2. Creating Session...');
        // Create Session (Dashboard)
        const sessionRes = await axios.post(`${API_URL}/api/pages/session`, {}, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const { token: sessionToken, deepLink } = sessionRes.data;
        console.log('✅ Session Created:', deepLink);

        console.log('3. simulating SDK Upload...');
        // Upload Page (SDK)
        // Create a dummy image
        const dummyImagePath = path.join(__dirname, 'dummy_screenshot.jpg');
        if (!fs.existsSync(dummyImagePath)) {
            fs.writeFileSync(dummyImagePath, 'dummy image content');
            // Note: Sharp might fail on real image check if we just write text, 
            // but for logic flow (token check) it might pass until sharp.
            // Actually sharp will fail. I should probably skip sharp or mock a real image.
            // For now, let's hope I can just use a real file if exists or create a minimal valid jpg buffer.
        }

        const form = new FormData();
        // Create a minimal valid 1x1 pixel JPG
        const minimalJpg = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');

        form.append('screenshot', minimalJpg, { filename: 'screenshot.jpg' });
        form.append('name', 'Test Page');
        form.append('pageTag', 'test_flow');
        form.append('elements', JSON.stringify([{ id: 'btn_1', rect: { x: 10, y: 10, w: 100, h: 50 } }]));
        form.append('deviceMetadata', JSON.stringify({ width: 1080, height: 1920, density: 3 }));

        const uploadRes = await axios.post(`${API_URL}/api/pages/upload`, form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${sessionToken}` // Using the Session Token!
            }
        });
        console.log('✅ Upload Success:', uploadRes.data);

        console.log('4. Listing Pages...');
        // List Pages (Dashboard)
        const listRes = await axios.get(`${API_URL}/api/pages`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ Found ${listRes.data.pages.length} pages`);

    } catch (error) {
        console.error('❌ Test Failed:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    }
}

testPageFeature();
