const Segment = require('../models/Segment');

class SegmentController {
    async listSegments(req, res) {
        try {
            const orgId = req.orgId;
            const segments = await Segment.find({ organization_id: orgId }).sort({ createdAt: -1 });
            res.json({ segments });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async createSegment(req, res) {
        try {
            const orgId = req.orgId;
            const segment = await Segment.create({
                ...req.body,
                segment_id: `seg_${Date.now()}`,
                organization_id: orgId
            });
            res.status(201).json(segment);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async deleteSegment(req, res) {
        try {
            const orgId = req.orgId;
            const { id } = req.params;
            await Segment.findOneAndDelete({ _id: id, organization_id: orgId });
            res.json({ ok: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new SegmentController();
