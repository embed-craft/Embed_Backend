const mongoose = require('mongoose');

const SegmentSchema = new mongoose.Schema({
    segment_id: { type: String, required: true, unique: true },
    organization_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    conditions: { type: String, default: 'All Users' }, // Human readable summary
    rules: [{
        id: Number,
        type: { type: String, enum: ['event', 'attribute'] },
        field: String,
        operator: String,
        value: String
    }],
    users_count: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Segment', SegmentSchema);
