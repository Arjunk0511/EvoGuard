/**
 * EvoGuard Security / Deception Middleware
 * -----------------------------------------
 * Runs the IDS risk engine and, when a suitable
 * deception target is selected, redirects the
 * suspicious request to a honeypot.
 */

const analyzeRequest = require("../security/riskEngine");

const {
    selectHoneypot
} = require("../security/deceptionService");


function securityMiddleware(req, res, next) {

    try {

        // -----------------------------------------
        // Prevent redirect loops
        // -----------------------------------------

        if (
            req.path.startsWith("/honeypot/")
        ) {

            return next();

        }

        const riskResult =
            analyzeRequest(req);


        // Attach the result to the request.
        // This allows later middleware/controllers
        // to inspect it if necessary.

        req.evoGuardRisk = riskResult;


        // -----------------------------------------
        // Normal request
        // -----------------------------------------

        if (!riskResult.detected) {

            return next();

        }


        // -----------------------------------------
        // Select deception target
        // -----------------------------------------

        const deception =
            selectHoneypot(riskResult);


        // -----------------------------------------
        // No suitable honeypot
        // -----------------------------------------

        if (!deception.shouldRedirect) {

            return next();

        }


        


        // -----------------------------------------
        // Store deception information
        // -----------------------------------------

        req.evoGuardDeception =
            deception;


        console.log(
            `[EvoGuard] ${req.ip} -> ` +
            `${deception.honeypot.type} ` +
            `(${deception.selectedAttack})`
        );


        // -----------------------------------------
        // Redirect attacker
        // -----------------------------------------

        return res.redirect(
            deception.honeypot.path
        );

    } catch (error) {

        console.error(
            "EvoGuard security middleware error:",
            error
        );

        // Fail open:
        // don't break the application if the
        // security layer encounters an error.

        return next();

    }

}


module.exports = securityMiddleware;