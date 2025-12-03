const mongoose = require('mongoose');

const FlowSchema = new mongoose.Schema({
    flow_id: { type: String, required: true, unique: true },
    organization_id: { type: String, required: true, index: true },
    title: { type: String, required: true },
    status: { type: String, enum: ['active', 'draft', 'archived'], default: 'draft' },
    steps: [{ type: Object }], // Flexible structure for flow steps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Flow', FlowSchema);
