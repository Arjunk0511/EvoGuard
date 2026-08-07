/**
 * Risk Engine
 * -----------------------------------
 * Runs all IDS detectors and calculates
 * the overall risk score for a request.
 */

const {
    sqlInjectionDetector,
    xssDetector,
    pathTraversalDetector,
    suspiciousUrlDetector,
    botDetector,
    bruteForceDetector,
    requestRateDetector
} = require("./detectors");

const { RISK_THRESHOLDS } = require("./constants");

/**
 * Analyze an incoming request
 *
 * @param {import("express").Request} req
 * @returns {Object}
 */
function analyzeRequest(req) {

    const ip =
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.connection?.remoteAddress ||
        "unknown";

    // Record every request for rate detection
    requestRateDetector.recordRequest(ip);

    // Run all detectors
    const detectorResults = [

        sqlInjectionDetector(req),

        xssDetector(req),

        pathTraversalDetector(req),

        suspiciousUrlDetector(req),

        botDetector(req),

        bruteForceDetector.checkBruteForce(ip),

        requestRateDetector.checkRequestRate(ip)

    ];

    let totalRisk = 0;

    const attackTypes = new Set();

    const reasons = [];

    const detectorDetails = [];

    // Process results
    for (const result of detectorResults) {

        detectorDetails.push(result);

        if (result.detected) {

            totalRisk += result.score;

            attackTypes.add(result.attackType);

            reasons.push(result.reason);

        }

    }

    // Maximum risk score = 100
    const riskScore = Math.min(
        totalRisk,
        RISK_THRESHOLDS.MAX_SCORE
    );

    // Decide action
    let action = "ALLOW";

    if (riskScore >= RISK_THRESHOLDS.BLOCK) {

        action = "BLOCK";

    } else if (riskScore >= RISK_THRESHOLDS.MONITOR) {

        action = "MONITOR";

    }

    return {

        detected: attackTypes.size > 0,

        timestamp: new Date().toISOString(),

        riskScore,

        action,

        attackTypes: [...attackTypes],

        reasons,

        detectorDetails

    };

}

module.exports = analyzeRequest;