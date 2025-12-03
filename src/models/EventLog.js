const mongoose = require('mongoose');

const EventLogSchema = new mongoose.Schema({
    nudge_id: { type: String, index: true },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    user_id: { type: String, required: true, index: true },
    event_type: {
        type: String,
        required: true
    },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Object }
});

module.exports = mongoose.model('EventLog', EventLogSchema);
