const Event = require('../models/Event');
const Property = require('../models/Property');

// --- Events ---

exports.getEvents = async (req, res) => {
    try {
        const orgId = req.orgId;
        const events = await Event.find({ organization_id: orgId })
            .populate('properties')
            .sort({ name: 1 });
        res.json(events);
    } catch (error) {
        console.error('Get Events Error:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const orgId = req.orgId;
        const { name, displayName, description, source, category, schema, tags, isDeprecated, deprecationReason, properties } = req.body;

        // Basic validation
        if (!name) {
            return res.status(400).json({ error: 'Event name is required' });
        }

        const newEvent = new Event({
            name,
            displayName: displayName || name,
            description,
            source,
            category,
            jsonSchema: schema,
            tags,
            isDeprecated,
            deprecationReason,
            properties: properties || [],
            organization_id: orgId
        });

        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (error) {
        console.error('Create Event Error:', error);
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Event with this name already exists' });
        }
        res.status(500).json({ error: 'Failed to create event' });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const orgId = req.orgId;
        const updates = req.body;
        if (updates.schema) {
            updates.jsonSchema = updates.schema;
            delete updates.schema;
        }

        const event = await Event.findOneAndUpdate(
            { _id: id, organization_id: orgId },
            updates,
            { new: true }
        ).populate('properties');

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json(event);
    } catch (error) {
        console.error('Update Event Error:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const orgId = req.orgId;

        const event = await Event.findOneAndDelete({ _id: id, organization_id: orgId });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ ok: true });
    } catch (error) {
        console.error('Delete Event Error:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
};

// --- Properties ---

exports.getProperties = async (req, res) => {
    try {
        const orgId = req.orgId;
        const properties = await Property.find({ organization_id: orgId }).sort({ name: 1 });
        res.json(properties);
    } catch (error) {
        console.error('Get Properties Error:', error);
        res.status(500).json({ error: 'Failed to fetch properties' });
    }
};

exports.createProperty = async (req, res) => {
    try {
        const orgId = req.orgId;
        const {
            name, displayName, description, type, options, defaultValue,
            isPrivate, isPII, validationRegex, minValue, maxValue, unit, tags
        } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: 'Name and Type are required' });
        }

        const newProperty = new Property({
            name,
            displayName: displayName || name,
            description,
            type,
            options,
            defaultValue,
            isPrivate,
            isPII,
            validationRegex,
            minValue,
            maxValue,
            unit,
            tags,
            organization_id: orgId
        });

        await newProperty.save();
        res.status(201).json(newProperty);
    } catch (error) {
        console.error('Create Property Error:', error);
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Property with this name already exists' });
        }
        res.status(500).json({ error: 'Failed to create property' });
    }
};

exports.updateProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const orgId = req.orgId;
        const updates = req.body;

        const property = await Property.findOneAndUpdate(
            { _id: id, organization_id: orgId },
            updates,
            { new: true }
        );

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        res.json(property);
    } catch (error) {
        console.error('Update Property Error:', error);
        res.status(500).json({ error: 'Failed to update property' });
    }
};

exports.deleteProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const orgId = req.orgId;

        const property = await Property.findOneAndDelete({ _id: id, organization_id: orgId });

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        res.json({ ok: true });
    } catch (error) {
        console.error('Delete Property Error:', error);
        res.status(500).json({ error: 'Failed to delete property' });
    }
};
