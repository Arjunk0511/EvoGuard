const analyzeRequest = require("../security/riskEngine");

const req = {

    body: {

        username: "' UNION SELECT password FROM users",

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

    ip: "127.0.0.1",

    cookies: {}

};

console.log("========== RISK ENGINE ==========\n");

console.log(analyzeRequest(req));