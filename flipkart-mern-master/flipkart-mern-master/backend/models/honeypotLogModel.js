const mongoose = require('mongoose');

const honeypotLogSchema = new mongoose.Schema(
    {
        ipAddress: {
            type: String,
            required: true
        },

        sessionId: {
            type: String,
            required: true,
            index: true
        },

        requestId: {
            type: String,
            default: null
        },

        attackType: {
            type: String,
            default: 'UNKNOWN'
        },

        honeypotType: {
            type: String,
            enum: ['ADMIN', 'LOGIN', 'CATALOG', 'DATABASE'],
            required: true
        },

        originalEndpoint: {
            type: String,
            default: null
        },

        honeypotEndpoint: {
            type: String,
            required: true
        },

        method: {
            type: String,
            default: 'GET'
        },

        userAgent: {
            type: String,
            default: null
        },

        payload: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },

        query: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },

        interactionType: {
            type: String,
            required: true
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        enteredAt: {
            type: Date,
            default: Date.now
        },

        lastInteractionAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('HoneypotLog', honeypotLogSchema);