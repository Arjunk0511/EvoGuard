const {
  updateBehaviorProfile,
  removeOldTimestamps,
} = require("./behaviorStore");

const evaluateBehaviorRules = require("./behaviorRules");
const detectSuspiciousUserAgent = require("./userAgentDetector");

const ONE_MINUTE = 60 * 1000;
const FIVE_SECONDS = 5 * 1000;

const getPayloadKey = (requestData) => {
  return JSON.stringify({
    method: requestData.method,
    endpoint: requestData.endpoint,
    query: requestData.query || {},
    body: requestData.body || {},
    params: requestData.params || {},
  });
};

const runBehaviorEngine = (requestData) => {
  const identifier = requestData.ipAddress || "UNKNOWN";

  // Update the in-memory profile for this IP
  const profile = updateBehaviorProfile(
    identifier,
    requestData
  );

  // Keep only request timestamps from the last minute
  const recentTimestamps = removeOldTimestamps(
    profile,
    ONE_MINUTE
  );

  const currentTime = Date.now();

  // Count requests received during the last five seconds
  const requestsInFiveSeconds =
    profile.requestTimestamps.filter(
      (timestamp) =>
        timestamp >= currentTime - FIVE_SECONDS
    ).length;

  // Count unique endpoints visited by this IP
  const uniqueEndpoints = new Set(
    profile.endpoints
  ).size;

  // Find how many times this exact request was repeated
  const payloadKey = getPayloadKey(requestData);

  const repeatedPayloadCount =
    profile.payloadCounts[payloadKey] || 0;

  const metrics = {
    totalRequests: profile.totalRequests,
    requestsInWindow: recentTimestamps.length,
    requestsInFiveSeconds,
    uniqueEndpoints,
    repeatedPayloadCount,
    failedLoginAttempts:
      profile.failedLoginAttempts,
  };

  // Run standard behavioral rules
  const result = evaluateBehaviorRules(metrics);

  // Check whether the request comes from an automated tool
  const userAgentResult =
    detectSuspiciousUserAgent(
      requestData.userAgent
    );

  if (userAgentResult.detected) {
    result.detected = true;

    if (
      !result.behaviorTypes.includes(
        userAgentResult.behaviorType
      )
    ) {
      result.behaviorTypes.push(
        userAgentResult.behaviorType
      );
    }

    if (
      !result.reasons.includes(
        userAgentResult.reason
      )
    ) {
      result.reasons.push(
        userAgentResult.reason
      );
    }

    result.riskScore = Math.min(
      result.riskScore +
        userAgentResult.riskScore,
      100
    );

    if (result.riskScore >= 60) {
      result.action = "BLOCK";
    } else if (result.riskScore >= 30) {
      result.action = "MONITOR";
    }
  }

  return {
    ...result,
    metrics,
    identifier,
  };
};

module.exports = runBehaviorEngine;