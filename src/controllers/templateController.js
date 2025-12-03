const Template = require('../models/Template');

class TemplateController {
    async listTemplates(req, res) {
        try {
            const orgId = req.orgId;
            // Fetch org specific templates + system templates
            const templates = await Template.find({
                $or: [
                    { organization_id: orgId },
                    { is_system: true }
                ]
            }).sort({ createdAt: -1 });
            res.json({ templates });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async createTemplate(req, res) {
        try {
            const orgId = req.orgId;
            const template = await Template.create({
                ...req.body,
                template_id: `tpl_${Date.now()}`,
                organization_id: orgId,
                is_system: false
            });
            res.status(201).json(template);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async deleteTemplate(req, res) {
        try {
            const orgId = req.orgId;
            const { id } = req.params;
            await Template.findOneAndDelete({ _id: id, organization_id: orgId });
            res.json({ ok: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new TemplateController();
