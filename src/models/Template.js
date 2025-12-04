const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, required: true }, // 'modal', 'banner', etc.
    thumbnail: { type: String },
    config: { type: Object }, // The JSON config for the template
    layers: { type: [mongoose.Schema.Types.Mixed], default: [] }, // Stores UI layers
    is_system: { type: Boolean, default: false }, // If true, available to all orgs
    tags: { type: [String], default: [] },
    description: { type: String },
    category: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Template', TemplateSchema);
