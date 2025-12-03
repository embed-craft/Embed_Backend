const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['image', 'file'],
        required: true
    },
    url: {
        type: String,
        required: true
    },
    size: {
        type: String, // e.g. "1.2 MB"
        required: true
    },
    organization_id: {
        type: String,
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Asset', assetSchema);
