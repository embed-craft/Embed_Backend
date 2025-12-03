const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://127.0.0.1:27017';

async function listDatabases() {
    try {
        await mongoose.connect(MONGO_URI);
        const admin = new mongoose.mongo.Admin(mongoose.connection.db);
        const result = await admin.listDatabases();
        console.log('Databases on 127.0.0.1:27017:');
        result.databases.forEach(db => console.log(` - ${db.name} (${db.sizeOnDisk} bytes)`));
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

listDatabases();
