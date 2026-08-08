const honeypotLogService = require('../services/honeypotLogService');


exports.recordEvent = async (req, res, next) => {
    try {
        const {
            sessionId,
            requestId,
            attackType,
            honeypotType,
            originalEndpoint,
            honeypotEndpoint,
            interactionType,
            payload,
            query,
            metadata
        } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'sessionId is required'
            });
        }

        if (!honeypotType) {
            return res.status(400).json({
                success: false,
                message: 'honeypotType is required'
            });
        }

        if (!honeypotEndpoint) {
            return res.status(400).json({
                success: false,
                message: 'honeypotEndpoint is required'
            });
        }

        if (!interactionType) {
            return res.status(400).json({
                success: false,
                message: 'interactionType is required'
            });
        }

        const ipAddress =
            req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.socket.remoteAddress ||
            'unknown';

        const userAgent =
            req.headers['user-agent'] || 'unknown';

        const log = await honeypotLogService.recordInteraction({
            ipAddress,
            sessionId,
            requestId: requestId || null,
            attackType: attackType || 'UNKNOWN',
            honeypotType,
            originalEndpoint: originalEndpoint || null,
            honeypotEndpoint,
            method: req.method,
            userAgent,
            payload: payload || null,
            query: query || null,
            interactionType,
            metadata: metadata || {}
        });

        res.status(201).json({
            success: true,
            message: 'Honeypot event recorded',
            data: log
        });

    } catch (error) {
        next(error);
    }
};


exports.getLogs = async (req, res, next) => {
    try {
        const logs = await honeypotLogService.getAllLogs();

        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs
        });

    } catch (error) {
        next(error);
    }
};


exports.getSessionLogs = async (req, res, next) => {
    try {
        const { sessionId } = req.params;

        const logs =
            await honeypotLogService.getLogsBySession(sessionId);

        res.status(200).json({
            success: true,
            count: logs.length,
            sessionId,
            data: logs
        });

    } catch (error) {
        next(error);
    }
};