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
            })
                .sort({ createdAt: -1 })
                .populate('createdBy', 'name email')
                .populate('lastEditedBy', 'name email');

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
                organization_id: orgId,
                is_system: false,
                createdBy: req.user.id,
                lastEditedBy: req.user.id
            });
            res.status(201).json(template);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getTemplate(req, res) {
        try {
            const orgId = req.orgId;
            const { id } = req.params;
            const template = await Template.findOne({
                _id: id,
                $or: [
                    { organization_id: orgId },
                    { is_system: true }
                ]
            })
                .populate('createdBy', 'name email')
                .populate('lastEditedBy', 'name email');

            if (!template) {
                return res.status(404).json({ error: 'Template not found' });
            }

            res.json(template);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateTemplate(req, res) {
        try {
            const orgId = req.orgId;
            const { id } = req.params;
            const updates = req.body;

            // Prevent updating ownership or system status
            delete updates.organization_id;
            delete updates.is_system;
            delete updates._id;

            const template = await Template.findOneAndUpdate(
                { _id: id, organization_id: orgId },
                {
                    ...updates,
                    updatedAt: Date.now(),
                    lastEditedBy: req.user.id
                },
                { new: true }
            );

            if (!template) {
                return res.status(404).json({ error: 'Template not found or unauthorized' });
            }

            res.json(template);
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
