const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const Organization = require('../src/models/Organization');

const verifySdk = async () => {
    try {
        // 1. Connect to DB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 2. Fetch the most recent Organization (likely the user's)
        const org = await Organization.findOne().sort({ createdAt: -1 });

        if (!org) {
            console.error('No Organization found!');
            process.exit(1);
        }

        const apiKey = org.api_key;
        console.log(`\nTesting with API Key: ${apiKey}`);
        console.log(`Organization ID: ${org._id}`);

        // 3. Simulate SDK Request
        const sdkUrl = 'http://localhost:4000/api/v1/nudge/fetch?screenName=Home&platform=Android';
        console.log(`\nMaking Request to: ${sdkUrl}`);

        try {
            const response = await axios.get(sdkUrl, {
                headers: {
                    'x-api-key': apiKey
                }
            });

            console.log('\n✅ SDK Integration Test PASSED');
            console.log('Status:', response.status);
            console.log('Response Data:', JSON.stringify(response.data, null, 2));

        } catch (apiError) {
            console.error('\n❌ SDK Integration Test FAILED');
            if (apiError.response) {
                console.error('Status:', apiError.response.status);
                console.error('Error Data:', apiError.response.data);
            } else {
                console.error('Error:', apiError.message);
            }
        }

    } catch (error) {
        console.error('Script Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

verifySdk();
