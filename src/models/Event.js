const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    displayName: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    source: {
        type: String,
        enum: ['client', 'server', 'custom', 'integration', 'sdk_autodetected'],
        default: 'client'
    },
    category: {
        type: String,
        default: 'general'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    jsonSchema: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    version: {
        type: Number,
        default: 1
    },
    isDeprecated: {
        type: Boolean,
        default: false
    },
    deprecationReason: {
        type: String
    },
    tags: [String],
    properties: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property'
    }],
    owner: {
        type: String
    },
    validationLevel: {
        type: String,
        enum: ['strict', 'lax', 'none'],
        default: 'lax'
    },
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    }
}, {
    timestamps: true
});

// Compound index to ensure unique event names per organization
eventSchema.index({ organization_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Event', eventSchema);
