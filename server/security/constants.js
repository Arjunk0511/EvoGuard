/**
 * EvoGuard IDS Constants
 * -----------------------------------
 * Centralized configuration for
 * risk scores, thresholds and limits.
 */

const RISK_SCORES = {

    SQL_INJECTION: 70,

    XSS: 60,

    PATH_TRAVERSAL: 65,

    SUSPICIOUS_URL: 40,

    BRUTE_FORCE: 70,

    HIGH_REQUEST_RATE: 50,

    USER_AGENT: {

        SQLMAP: 25,

        NIKTO: 25,

        ACUNETIX: 25,

        NMAP: 25,

        MASSCAN: 25,

        PYTHON_REQUESTS: 20,

        APACHE_BENCH: 20,

        GO_HTTP_CLIENT: 15,

        JAVA: 15,

        WGET: 15,

        CURL: 10,

        POSTMAN: 5

    }

};

const RISK_THRESHOLDS = {

    // Final score is always capped at 100
    MAX_SCORE: 100,

    // 0 - 39
    ALLOW: 0,

    // 40 - 69
    MONITOR: 40,

    // 70+
    BLOCK: 70

};

const BRUTE_FORCE = {

    // Maximum failed login attempts
    MAX_ATTEMPTS: 5,

    // 1 minute
    WINDOW_TIME: 60 * 1000

};

const REQUEST_RATE = {

    // Maximum requests in 1 minute
    MAX_REQUESTS: 50,

    // 1 minute
    WINDOW_TIME: 60 * 1000

};

module.exports = {

    RISK_SCORES,

    RISK_THRESHOLDS,

    BRUTE_FORCE,

    REQUEST_RATE

};