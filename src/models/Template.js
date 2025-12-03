const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
    template_id: { type: String, required: true, unique: true },
    organization_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, required: true }, // 'modal', 'banner', etc.
    thumbnail: { type: String },
    config: { type: Object }, // The JSON config for the template
    is_system: { type: Boolean, default: false }, // If true, available to all orgs
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Template', TemplateSchema);
