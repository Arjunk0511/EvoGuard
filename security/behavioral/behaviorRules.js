const evaluateBehaviorRules = (metrics) => {
  const behaviorTypes = [];
  const reasons = [];
  let riskScore = 0;

  // Rule 1: Possible DoS request burst
  if (metrics.requestsInFiveSeconds >= 15) {
    behaviorTypes.push("POSSIBLE_DOS");

    reasons.push(
      "Fifteen or more requests were received from the same IP within five seconds.",
    );

    riskScore += 80;
  }

  // Rule 2: High request rate
  if (metrics.requestsInWindow >= 10) {
    behaviorTypes.push("HIGH_REQUEST_RATE");

    reasons.push(
      "Ten or more requests were received from the same IP within one minute.",
    );

    riskScore += 45;
  }

  // Rule 3: Endpoint scanning
  if (metrics.uniqueEndpoints >= 8) {
    behaviorTypes.push("ENDPOINT_SCANNING");

    reasons.push(
      "The same IP accessed many different endpoints within a short period.",
    );

    riskScore += 40;
  }

  // Rule 4: Repeated request payload
  if (metrics.repeatedPayloadCount >= 6) {
    behaviorTypes.push("REPEATED_PAYLOAD");

    reasons.push("The same request payload was repeated multiple times.");

    riskScore += 35;
  }

  // Rule 5: Brute-force login attempts
  if (metrics.failedLoginAttempts >= 5) {
    behaviorTypes.push("BRUTE_FORCE");

    reasons.push("Five or more failed login attempts were detected.");

    riskScore += 70;
  }

  // Keep risk between 0 and 100
  riskScore = Math.min(Math.max(riskScore, 0), 100);

  let action = "ALLOW";

  if (riskScore >= 60) {
    action = "BLOCK";
  } else if (riskScore >= 30) {
    action = "MONITOR";
  }

  return {
    detected: behaviorTypes.length > 0,
    behaviorTypes,
    riskScore,
    reasons,
    action,
  };
};

module.exports = evaluateBehaviorRules;
