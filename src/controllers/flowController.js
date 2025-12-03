const Flow = require('../models/Flow');

class FlowController {
    async listFlows(req, res) {
        try {
            const orgId = req.orgId;
            const flows = await Flow.find({ organization_id: orgId }).sort({ createdAt: -1 });
            res.json({ flows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async createFlow(req, res) {
        try {
            const orgId = req.orgId;
            const flow = await Flow.create({
                ...req.body,
                flow_id: `flow_${Date.now()}`,
                organization_id: orgId
            });
            res.status(201).json(flow);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async deleteFlow(req, res) {
        try {
            const orgId = req.orgId;
            const { id } = req.params;
            await Flow.findOneAndDelete({ _id: id, organization_id: orgId });
            res.json({ ok: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new FlowController();
