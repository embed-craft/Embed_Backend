const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    user_id: { type: String, required: true, index: true }, // External ID provided by SDK

    // User Profile
    name: String,
    email: String,
    phone: String,
    referralCode: String,

    // Custom Properties
    properties: { type: mongoose.Schema.Types.Mixed, default: {} },

    // System Metadata
    last_seen: { type: Date, default: Date.now },
    sessions_count: { type: Number, default: 0 },

    // Device Info (updated on identify)
    device: {
        platform: String,
        os_version: String,
        app_version: String,
        model: String
    }
}, { timestamps: true });

// Compound index for unique users per organization
UserSchema.index({ organization_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('EndUser', UserSchema);
