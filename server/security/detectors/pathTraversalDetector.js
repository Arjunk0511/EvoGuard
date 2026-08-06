/**
 * Path Traversal Detector
 * -----------------------------------
 * Detects directory traversal attacks
 * such as ../ , ..\, /etc/passwd, etc.
 */

const { RISK_SCORES } = require("../constants");
const extractRequestData = require("../utils/extractRequestData");

/**
 * Path Traversal Patterns
 */
const PATH_PATTERNS = [

    {
        regex: /\.\.\//,
        reason: "../ directory traversal detected"
    },

    {
        regex: /\.\.\\/,
        reason: "..\\ directory traversal detected"
    },

    {
        regex: /%2e%2e%2f/i,
        reason: "Encoded ../ traversal detected"
    },

    {
        regex: /%2e%2e%5c/i,
        reason: "Encoded ..\\ traversal detected"
    },

    {
        regex: /%252e%252e%252f/i,
        reason: "Double encoded ../ traversal detected"
    },

    {
        regex: /\/etc\/passwd/i,
        reason: "/etc/passwd access detected"
    },

    {
        regex: /\/etc\/shadow/i,
        reason: "/etc/shadow access detected"
    },

    {
        regex: /boot\.ini/i,
        reason: "boot.ini access detected"
    },

    {
        regex: /windows\/system32/i,
        reason: "Windows System32 access detected"
    },

    {
        regex: /winnt/i,
        reason: "Windows directory access detected"
    },

    {
        regex: /system32/i,
        reason: "System32 access detected"
    },

    {
        regex: /proc\/self/i,
        reason: "/proc/self access detected"
    },

    {
        regex: /proc\/version/i,
        reason: "/proc/version access detected"
    },

    {
        regex: /web\.config/i,
        reason: "web.config access detected"
    }

];

/**
 * Scan a string for Path Traversal attacks.
 *
 * @param {string} text
 * @returns {Object|null}
 */
function scan(text) {

    if (!text) return null;

    for (const pattern of PATH_PATTERNS) {

        if (pattern.regex.test(text)) {

            return {

                detector: "PathTraversalDetector",

                detected: true,

                attackType: "PATH_TRAVERSAL",

                severity: "HIGH",

                score: RISK_SCORES.PATH_TRAVERSAL,

                reason: pattern.reason

            };

        }

    }

    return null;

}

/**
 * Path Traversal Detector
 *
 * @param {import("express").Request} req
 * @returns {Object}
 */
function pathTraversalDetector(req) {

    const inputs = extractRequestData(req);

    for (const input of inputs) {

        const result = scan(input);

        if (result) {
            return result;
        }

    }

    return {

        detector: "PathTraversalDetector",

        detected: false,

        attackType: null,

        severity: null,

        score: 0,

        reason: null

    };

}

module.exports = pathTraversalDetector;