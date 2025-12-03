const mongoose = require('mongoose');
const crypto = require('crypto');

const OrganizationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    api_key: { type: String, unique: true, index: true },

    // Contract & Billing
    contract_start_date: { type: Date },
    contract_end_date: { type: Date },
    plan_limit: { type: Number, default: 100000 }, // Requests per month
    is_active: { type: Boolean, default: true }, // The Kill Switch

    // Contact Info
    admin_email: { type: String },

    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdAt: { type: Date, default: Date.now }
});

// Generate API Key before saving if not present
// Generate API Key before saving if not present
OrganizationSchema.pre('save', async function () {
    if (!this.api_key) {
        this.api_key = `nk_live_${crypto.randomBytes(16).toString('hex')}`;
    }
});

module.exports = mongoose.model('Organization', OrganizationSchema);
