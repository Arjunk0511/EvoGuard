const HoneypotLog = require('../models/honeypotLogModel');

const recordInteraction = async ({
    ipAddress,
    sessionId,
    requestId,
    attackType,
    honeypotType,
    originalEndpoint,
    honeypotEndpoint,
    method,
    userAgent,
    payload,
    query,
    interactionType,
    metadata
}) => {
    const log = await HoneypotLog.create({
        ipAddress,
        sessionId,
        requestId,
        attackType,
        honeypotType,
        originalEndpoint,
        honeypotEndpoint,
        method,
        userAgent,
        payload,
        query,
        interactionType,
        metadata,
        lastInteractionAt: new Date()
    });

    return log;
};


const getAllLogs = async () => {
    return await HoneypotLog
        .find()
        .sort({ lastInteractionAt: -1 });
};


const getLogsBySession = async (sessionId) => {
    return await HoneypotLog
        .find({ sessionId })
        .sort({ lastInteractionAt: 1 });
};


module.exports = {
    recordInteraction,
    getAllLogs,
    getLogsBySession
};