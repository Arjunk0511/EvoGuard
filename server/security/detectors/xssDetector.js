/**
 * XSS Detector
 * -----------------------------------
 * Detects common Cross Site Scripting (XSS)
 * payloads in request body, query,
 * params and URL.
 */

const { RISK_SCORES } = require("../constants");
const extractRequestData = require("../utils/extractRequestData");

/**
 * XSS Patterns
 */
const XSS_PATTERNS = [

    {
        regex: /<script\b[^>]*>(.*?)<\/script>/i,
        reason: "<script> tag detected"
    },

    {
        regex: /javascript:/i,
        reason: "javascript: protocol detected"
    },

    {
        regex: /vbscript:/i,
        reason: "VBScript payload detected"
    },

    {
        regex: /onerror\s*=/i,
        reason: "onerror event detected"
    },

    {
        regex: /onload\s*=/i,
        reason: "onload event detected"
    },

    {
        regex: /onclick\s*=/i,
        reason: "onclick event detected"
    },

    {
        regex: /onmouseover\s*=/i,
        reason: "onmouseover event detected"
    },

    {
        regex: /onfocus\s*=/i,
        reason: "onfocus event detected"
    },

    {
        regex: /onmouseenter\s*=/i,
        reason: "onmouseenter event detected"
    },

    {
        regex: /<img\b/i,
        reason: "<img> tag detected"
    },

    {
        regex: /<iframe\b/i,
        reason: "<iframe> tag detected"
    },

    {
        regex: /<svg\b/i,
        reason: "<svg> tag detected"
    },

    {
        regex: /<object\b/i,
        reason: "<object> tag detected"
    },

    {
        regex: /<embed\b/i,
        reason: "<embed> tag detected"
    },

    {
        regex: /document\.cookie/i,
        reason: "document.cookie access detected"
    },

    {
        regex: /document\.location/i,
        reason: "document.location access detected"
    },

    {
        regex: /window\.location/i,
        reason: "window.location access detected"
    },

    {
        regex: /eval\s*\(/i,
        reason: "eval() detected"
    },

    {
        regex: /settimeout\s*\(/i,
        reason: "setTimeout() detected"
    },

    {
        regex: /setinterval\s*\(/i,
        reason: "setInterval() detected"
    },

    {
        regex: /alert\s*\(/i,
        reason: "alert() detected"
    }

];

/**
 * Scan a string for XSS payloads.
 *
 * @param {string} text
 * @returns {Object|null}
 */
function scan(text) {

    if (!text) return null;

    for (const pattern of XSS_PATTERNS) {

        if (pattern.regex.test(text)) {

            return {

                detector: "XSSDetector",

                detected: true,

                attackType: "XSS",

                severity: "HIGH",

                score: RISK_SCORES.XSS,

                reason: pattern.reason

            };

        }

    }

    return null;

}

/**
 * XSS Detector
 *
 * @param {import("express").Request} req
 * @returns {Object}
 */
function xssDetector(req) {

    const inputs = extractRequestData(req);

    for (const input of inputs) {

        const result = scan(input);

        if (result) {
            return result;
        }

    }

    return {

        detector: "XSSDetector",

        detected: false,

        attackType: null,

        severity: null,

        score: 0,

        reason: null

    };

}

module.exports = xssDetector;   