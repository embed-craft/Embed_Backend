const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    displayName: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['string', 'number', 'boolean', 'date', 'array', 'object'],
        required: true
    },
    options: [{
        type: String // For enum types
    }],
    defaultValue: {
        type: mongoose.Schema.Types.Mixed
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    isPII: {
        type: Boolean,
        default: false // Personally Identifiable Information
    },
    validationRegex: {
        type: String
    },
    minValue: {
        type: Number
    },
    maxValue: {
        type: Number
    },
    minLength: {
        type: Number
    },
    maxLength: {
        type: Number
    },
    unit: {
        type: String // e.g., 'USD', 'seconds', 'pixels'
    },
    exampleValue: {
        type: String
    },
    tags: [{
        type: String
    }],
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    }
}, {
    timestamps: true
});

// Compound index to ensure unique property names per organization
propertySchema.index({ organization_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Property', propertySchema);
