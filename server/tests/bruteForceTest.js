const bruteForce = require("../security/detectors/bruteForceDetector");

const ip = "192.168.1.10";

console.log("Recording failed login attempts...\n");

for (let i = 1; i <= 5; i++) {

    bruteForce.recordFailedAttempt(ip);

    console.log(`Attempt ${i}`);

}

console.log("\nResult:\n");

console.log(bruteForce.checkBruteForce(ip));