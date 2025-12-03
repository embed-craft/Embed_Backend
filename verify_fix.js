const mongoose = require('mongoose');
const Event = require('./src/models/Event');
const Property = require('./src/models/Property');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nudge_db';

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // 1. Create a Property
        const propName = 'test_prop_' + Date.now();
        const property = new Property({
            name: propName,
            type: 'string',
            organization_id: new mongoose.Types.ObjectId()
        });
        await property.save();
        console.log('Created Property:', property.name);

        // 2. Create an Event with jsonSchema and linked Property
        const eventName = 'test_event_' + Date.now();
        const event = new Event({
            name: eventName,
            organization_id: property.organization_id,
            jsonSchema: { type: 'object', properties: { [propName]: { type: 'string' } } },
            properties: [property._id]
        });
        await event.save();
        console.log('Created Event:', event.name);

        // 3. Verify Fetch and Populate
        const fetchedEvent = await Event.findById(event._id).populate('properties');
        console.log('Fetched Event Properties:', fetchedEvent.properties.length);
        console.log('Fetched Event jsonSchema:', JSON.stringify(fetchedEvent.jsonSchema));

        if (fetchedEvent.properties.length === 1 && fetchedEvent.properties[0].name === propName) {
            console.log('SUCCESS: Property linked correctly.');
        } else {
            console.error('FAILURE: Property not linked correctly.');
        }

        // Cleanup
        await Event.deleteOne({ _id: event._id });
        await Property.deleteOne({ _id: property._id });
        console.log('Cleanup done.');

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
