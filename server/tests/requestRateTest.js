const requestRate = require("../security/detectors/requestRateDetector");

const ip = "192.168.1.10";

console.log("Generating requests...\n");

for (let i = 1; i <= 55; i++) {

    requestRate.recordRequest(ip);

}

console.log(requestRate.checkRequestRate(ip));