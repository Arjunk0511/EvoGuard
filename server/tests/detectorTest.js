const {
    sqlInjectionDetector,
    xssDetector,
    pathTraversalDetector,
    suspiciousUrlDetector,
    botDetector
} = require("../security/detectors");

const req = {

    body: {
        username: "' OR 1=1 --",
        comment: "<script>alert('XSS')</script>"
    },

    query: {
        file: "../../etc/passwd"
    },

    params: {},

    originalUrl: "/.env",

    path: "/.env",

    headers: {
        "user-agent": "sqlmap"
    },

    cookies: {}

};

console.log("========== SQL ==========");
console.log(sqlInjectionDetector(req));

console.log("\n========== XSS ==========");
console.log(xssDetector(req));

console.log("\n========== PATH ==========");
console.log(pathTraversalDetector(req));

console.log("\n========== URL ==========");
console.log(suspiciousUrlDetector(req));

console.log("\n========== BOT ==========");
console.log(botDetector(req));