/**
 * Brute Force Detector
 * -----------------------------------
 * Tracks failed login attempts by IP.
 */

const { BRUTE_FORCE, RISK_SCORES } = require("../constants");

// Store failed login attempts
const attempts = new Map();

/**
 * Remove expired attempts
 */
function cleanup(ip) {

    const now = Date.now();

    const records = attempts.get(ip) || [];

    const validAttempts = records.filter(
        timestamp => now - timestamp < BRUTE_FORCE.WINDOW_TIME
    );

    attempts.set(ip, validAttempts);

    return validAttempts;
}

/**
 * Record a failed login
 */
function recordFailedAttempt(ip) {

    const records = cleanup(ip);

    records.push(Date.now());

    attempts.set(ip, records);

}

/**
 * Clear attempts after successful login
 */
function clearAttempts(ip) {

    attempts.delete(ip);

}

/**
 * Check for brute force attack
 */
function checkBruteForce(ip) {

    const records = cleanup(ip);

    if (records.length >= BRUTE_FORCE.MAX_ATTEMPTS) {

        return {

            detector: "BruteForceDetector",

            detected: true,

            attackType: "BRUTE_FORCE",

            severity: "HIGH",

            score: RISK_SCORES.BRUTE_FORCE,

            reason: `${records.length} failed login attempts`

        };

    }

    return {

        detector: "BruteForceDetector",

        detected: false,

        attackType: null,

        severity: null,

        score: 0,

        reason: null

    };

}

module.exports = {

    recordFailedAttempt,

    clearAttempts,

    checkBruteForce

};