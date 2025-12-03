const mongoose = require('mongoose');

const NudgeSchema = new mongoose.Schema({
    nudge_id: { type: String, required: true, unique: true, index: true },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    campaign_name: { type: String, required: true },
    experience: { type: String, default: 'nudges' }, // nudges, messages, etc.

    // Campaign Configuration
    config: { type: mongoose.Schema.Types.Mixed, default: {} }, // Stores type (modal, banner), position, etc.
    layers: { type: [mongoose.Schema.Types.Mixed], default: [] }, // Stores UI layers

    // Targeting & Triggering
    trigger_event: { type: String, default: 'session_start', index: true },
    trigger_screen: { type: String, default: 'all', index: true },
    targeting: { type: mongoose.Schema.Types.Mixed, default: [] }, // Stores complex targeting rules
    segments: { type: [String], default: [] }, // User segments
    tags: { type: [String], default: [] }, // Campaign tags for organization

    // Scheduling
    schedule: {
        start_date: Date,
        end_date: Date,
        timezone: String
    },

    // Legacy / SDK Compatibility
    content: { type: mongoose.Schema.Types.Mixed }, // Optional fallback

    status: {
        type: String,
        enum: ['active', 'inactive', 'draft', 'archived'],
        default: 'draft',
        index: true
    },

    stats: {
        impressions: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 }
    },

    priority: { type: Number, default: 0 } // Higher shows first
}, { timestamps: true });

// Compound index for faster fetching: Active status + Screen + Org
NudgeSchema.index({ organization_id: 1, status: 1, trigger_screen: 1, priority: -1 });

module.exports = mongoose.model('Nudge', NudgeSchema);
