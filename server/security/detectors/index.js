module.exports = {

    sqlInjectionDetector: require("./sqlInjectionDetector"),

    xssDetector: require("./xssDetector"),

    pathTraversalDetector: require("./pathTraversalDetector"),

    suspiciousUrlDetector: require("./suspiciousUrlDetector"),

    botDetector: require("./botDetector"),

    bruteForceDetector: require("./bruteForceDetector"),

    requestRateDetector: require("./requestRateDetector"),

    adminEnumerationDetector: require("./adminEnumerationDetector")

};