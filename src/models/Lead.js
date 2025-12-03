const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
    externalId: { type: String, required: true, index: true }, // Unique ID for the lead
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },

    // Lead Details
    name: String,
    email: String,
    phone: String,

    // Attribution
    referredBy: { type: String, index: true }, // externalId of the referrer
    referralSource: String,

    // Metadata
    properties: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
        type: String,
        enum: ['pending', 'converted', 'expired'],
        default: 'pending'
    },

    convertedAt: Date
}, { timestamps: true });

// Compound index to ensure unique leads per organization
LeadSchema.index({ organization_id: 1, externalId: 1 }, { unique: true });

module.exports = mongoose.model('Lead', LeadSchema);
