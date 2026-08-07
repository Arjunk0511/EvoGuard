/**
 * Request Rate Detector
 * -----------------------------------
 * Detects unusually high request rate
 * from a single IP.
 */

const { REQUEST_RATE, RISK_SCORES } = require("../constants");

const requests = new Map();

/**
 * Remove expired requests
 */
function cleanup(ip) {

    const now = Date.now();

    const records = requests.get(ip) || [];

    const validRequests = records.filter(
        timestamp => now - timestamp < REQUEST_RATE.WINDOW_TIME
    );

    requests.set(ip, validRequests);

    return validRequests;

}

/**
 * Record every request
 */
function recordRequest(ip) {

    const records = cleanup(ip);

    records.push(Date.now());

    requests.set(ip, records);

}

/**
 * Check request rate
 */
function checkRequestRate(ip) {

    const records = cleanup(ip);

    if (records.length > REQUEST_RATE.MAX_REQUESTS) {

        return {

            detector: "RequestRateDetector",

            detected: true,

            attackType: "HIGH_REQUEST_RATE",

            severity: "MEDIUM",

            score: RISK_SCORES.HIGH_REQUEST_RATE,

            reason: `${records.length} requests within one minute`

        };

    }

    return {

        detector: "RequestRateDetector",

        detected: false,

        attackType: null,

        severity: null,

        score: 0,

        reason: null

    };

}

module.exports = {

    recordRequest,

    checkRequestRate

};