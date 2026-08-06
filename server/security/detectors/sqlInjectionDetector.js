/**
 * SQL Injection Detector
 * -----------------------------------
 * Detects common SQL Injection payloads
 * in request body, query, params and URL.
 */

const { RISK_SCORES } = require("../constants");
const extractRequestData = require("../utils/extractRequestData");

/**
 * SQL Injection Patterns
 */
const SQL_PATTERNS = [

    {
        regex: /\bunion\s+select\b/i,
        reason: "UNION SELECT detected"
    },

    {
        regex: /\bdrop\s+table\b/i,
        reason: "DROP TABLE detected"
    },

    {
        regex: /\binformation_schema\b/i,
        reason: "information_schema access detected"
    },

    {
        regex: /\bexec(\s|\()/i,
        reason: "EXEC command detected"
    },

    {
        regex: /\bsleep\s*\(/i,
        reason: "Time-based SQL Injection detected"
    },

    {
        regex: /\bbenchmark\s*\(/i,
        reason: "Benchmark function detected"
    },

    {
        regex: /\bload_file\s*\(/i,
        reason: "LOAD_FILE detected"
    },

    {
        regex: /\binto\s+outfile\b/i,
        reason: "INTO OUTFILE detected"
    },

    {
        regex: /\bselect\b.+\bfrom\b/i,
        reason: "SELECT FROM query detected"
    },

    {
        regex: /('|")\s*or\s*('|")?\d+('|")?\s*=\s*('|")?\d+/i,
        reason: "Numeric OR comparison detected"
    },

    {
        regex: /('|")\s*or\s*('|")?1('|")?\s*=\s*('|")?1/i,
        reason: "Authentication bypass detected"
    },

    {
        regex: /--/,
        reason: "SQL comment detected"
    },

    {
        regex: /\/\*/,
        reason: "SQL block comment detected"
    },

    {
        regex: /\*\//,
        reason: "SQL block comment end detected"
    },

    {
        regex: /%27/i,
        reason: "Encoded single quote detected"
    }

];

/**
 * Scan a string for SQL Injection.
 *
 * @param {string} text
 * @returns {Object|null}
 */
function scan(text) {

    if (!text) return null;

    for (const pattern of SQL_PATTERNS) {

        if (pattern.regex.test(text)) {

            return {

                detector: "SQLDetector",

                detected: true,

                attackType: "SQL_INJECTION",

                severity: "HIGH",

                score: RISK_SCORES.SQL_INJECTION,

                reason: pattern.reason

            };

        }

    }

    return null;

}

/**
 * SQL Injection Detector
 *
 * @param {import("express").Request} req
 * @returns {Object}
 */
function sqlInjectionDetector(req) {

    const inputs = extractRequestData(req);

    for (const input of inputs) {

        const result = scan(input);

        if (result) {
            return result;
        }

    }

    return {

        detector: "SQLDetector",

        detected: false,

        attackType: null,

        severity: null,

        score: 0,

        reason: null

    };

}

module.exports = sqlInjectionDetector;