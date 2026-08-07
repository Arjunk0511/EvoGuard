/**
 * Bot / Suspicious User-Agent Detector
 * -----------------------------------
 * Detects known scanners, bots and
 * penetration testing tools.
 */

const { RISK_SCORES } = require("../constants");

/**
 * Suspicious User Agents
 */
const USER_AGENTS = [

    {
        keyword: "sqlmap",
        score: RISK_SCORES.USER_AGENT.SQLMAP,
        reason: "SQLMap scanner detected"
    },

    {
        keyword: "nikto",
        score: RISK_SCORES.USER_AGENT.NIKTO,
        reason: "Nikto vulnerability scanner detected"
    },

    {
        keyword: "acunetix",
        score: RISK_SCORES.USER_AGENT.ACUNETIX,
        reason: "Acunetix scanner detected"
    },

    {
        keyword: "nmap",
        score: RISK_SCORES.USER_AGENT.NMAP,
        reason: "Nmap scanner detected"
    },

    {
        keyword: "masscan",
        score: RISK_SCORES.USER_AGENT.MASSCAN,
        reason: "Masscan scanner detected"
    },

    {
        keyword: "python-requests",
        score: RISK_SCORES.USER_AGENT.PYTHON_REQUESTS,
        reason: "Python Requests client detected"
    },

    {
        keyword: "apachebench",
        score: RISK_SCORES.USER_AGENT.APACHE_BENCH,
        reason: "Apache Benchmark detected"
    },

    {
        keyword: "go-http-client",
        score: RISK_SCORES.USER_AGENT.GO_HTTP_CLIENT,
        reason: "Go HTTP Client detected"
    },

    {
        keyword: "java",
        score: RISK_SCORES.USER_AGENT.JAVA,
        reason: "Java HTTP Client detected"
    },

    {
        keyword: "wget",
        score: RISK_SCORES.USER_AGENT.WGET,
        reason: "Wget client detected"
    },

    {
        keyword: "curl",
        score: RISK_SCORES.USER_AGENT.CURL,
        reason: "Curl client detected"
    },

    {
        keyword: "postmanruntime",
        score: RISK_SCORES.USER_AGENT.POSTMAN,
        reason: "Postman Runtime detected"
    }

];

/**
 * Detect suspicious user agents
 *
 * @param {import("express").Request} req
 * @returns {Object}
 */
function botDetector(req) {

    const userAgent = (req.headers["user-agent"] || "").toLowerCase();

    for (const agent of USER_AGENTS) {

        if (userAgent.includes(agent.keyword)) {

            return {

                detector: "BotDetector",

                detected: true,

                attackType: "SUSPICIOUS_USER_AGENT",

                severity: "LOW",

                score: agent.score,

                reason: agent.reason

            };

        }

    }

    return {

        detector: "BotDetector",

        detected: false,

        attackType: null,

        severity: null,

        score: 0,

        reason: null

    };

}

module.exports = botDetector;
