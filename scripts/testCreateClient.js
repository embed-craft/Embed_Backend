const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

async function testCreateClient() {
    try {
        // 1. Login as Super Admin
        console.log('Logging in as Super Admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@nudge.com',
            password: 'password123'
        });

        const token = loginRes.data.token;
        console.log('✅ Login Successful. Token received.');

        // 2. Create Client
        console.log('Creating Client...');
        const clientData = {
            name: 'Test Client',
            adminEmail: `testclient_${Date.now()}@example.com`,
            password: 'password123'
        };

        const createRes = await axios.post(`${API_URL}/admin/client`, clientData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Client Created Successfully:', createRes.data);

    } catch (error) {
        const fs = require('fs');
        const errorLog = `
Error Message: ${error.message}
Error Response: ${JSON.stringify(error.response ? error.response.data : 'No response data', null, 2)}
Full Stack: ${error.stack}
        `;
        fs.writeFileSync('client_creation_error.txt', errorLog);
        console.log('❌ Error logged to client_creation_error.txt');
    }
}

testCreateClient();
