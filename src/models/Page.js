const mongoose = require('mongoose');

const PageSchema = new mongoose.Schema({
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },

    // Identity
    name: { type: String, required: true }, // User friendly name (e.g. "Checkout Page")
    pageTag: { type: String, required: true, index: true }, // SDK Tag (e.g. "checkout_flow")

    // Visual Context
    imageUrl: { type: String, required: true }, // S3/Storage URL

    // Metadata for Resolution Independence & Targeting
    deviceMetadata: {
        orientation: { type: String, enum: ['portrait', 'landscape'], default: 'portrait' },
        width: { type: Number, required: true },  // Screenshot width
        height: { type: Number, required: true }, // Screenshot height
        density: { type: Number, default: 1 },    // Pixel density
        deviceType: { type: String, default: 'phone' } // phone, tablet
    },

    // The "Magic" Hashmap of Elements
    // Elements are stored relative to the screenshot dimensions
    elements: [{
        id: { type: String, required: true }, // The key used for targeting
        type: { type: String, default: 'view' }, // widget type
        rect: {
            x: Number,
            y: Number,
            width: Number,
            height: Number
        },
        inViewport: { type: Boolean, default: true } // If false, warn user element is off-screen
    }],

    // Security & Handshake
    sessionToken: { type: String, index: true }, // Token used for upload

    status: { type: String, enum: ['active', 'archived'], default: 'active' }
}, { timestamps: true });

// Index for fast lookup by Tag + Org (Versioning strategy: sort by createdAt desc)
PageSchema.index({ organization_id: 1, pageTag: 1, createdAt: -1 });

module.exports = mongoose.model('Page', PageSchema);
