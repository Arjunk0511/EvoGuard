/**
 * EvoGuard Deception Service
 * -----------------------------------
 * Selects a honeypot based on IDS results.
 */

const HONEYPOTS = {

    LOGIN: {
        type: "LOGIN",
        path: "/honeypot/login/"
    },

    ADMIN: {
        type: "ADMIN",
        path: "/honeypot/admin/"
    },

    CATALOG: {
        type: "CATALOG",
        path: "/honeypot/catalog/"
    }

};


/**
 * Attack priority
 *
 * Higher number = higher priority.
 */
const ATTACK_PRIORITY = {

    ADMIN_ENUMERATION: 100,

    BRUTE_FORCE: 90,

    SUSPICIOUS_USER_AGENT: 80,

    HIGH_REQUEST_RATE: 70,

    SUSPICIOUS_URL: 60,

    PATH_TRAVERSAL: 50,

    SQL_INJECTION: 50,

    XSS: 50

};


/**
 * Select the appropriate honeypot.
 *
 * @param {Object} riskResult
 * @returns {Object}
 */
function selectHoneypot(riskResult) {

    if (!riskResult) {

        return {
            shouldRedirect: false,
            honeypot: null,
            reason: "No risk result supplied"
        };

    }


    const {

        detected = false,

        riskScore = 0,

        action = "ALLOW",

        attackTypes = []

    } = riskResult;


    // -----------------------------------------
    // No attack
    // -----------------------------------------

    if (!detected || attackTypes.length === 0) {

        return {

            shouldRedirect: false,

            honeypot: null,

            riskScore,

            action,

            attackTypes,

            reason: "No suspicious activity detected"

        };

    }


    // -----------------------------------------
    // Find highest-priority attack
    // -----------------------------------------

    let selectedAttack = null;

    let highestPriority = -1;


    for (const attackType of attackTypes) {

        const priority =
            ATTACK_PRIORITY[attackType] || 0;


        if (priority > highestPriority) {

            highestPriority = priority;

            selectedAttack = attackType;

        }

    }


    // -----------------------------------------
    // Select honeypot
    // -----------------------------------------

    let honeypot = null;


    switch (selectedAttack) {

        // Brute-force attacks
        case "BRUTE_FORCE":

            honeypot = HONEYPOTS.LOGIN;

            break;


        // Admin enumeration
        case "ADMIN_ENUMERATION":

            honeypot = HONEYPOTS.ADMIN;

            break;


        // Suspicious clients / bots
        case "SUSPICIOUS_USER_AGENT":

        case "HIGH_REQUEST_RATE":

            honeypot = HONEYPOTS.CATALOG;

            break;


        default:

            return {

                shouldRedirect: false,

                honeypot: null,

                riskScore,

                action,

                attackTypes,

                selectedAttack,

                reason:
                    "No honeypot mapping available"

            };

    }


    return {

        shouldRedirect: true,

        honeypot,

        riskScore,

        action,

        attackTypes,

        selectedAttack,

        reason:
            `Selected ${honeypot.type} honeypot for ${selectedAttack}`

    };

}


module.exports = {

    selectHoneypot,

    HONEYPOTS,

    ATTACK_PRIORITY

};