const express = require('express');

const {
    recordEvent,
    getLogs,
    getSessionLogs
} = require('../controllers/honeypotController');

const router = express.Router();

router.post('/honeypot/events', recordEvent);

router.get('/honeypot/logs', getLogs);

router.get('/honeypot/logs/:sessionId', getSessionLogs);

module.exports = router;