const RiskProfile = require("../models/RiskProfile");

const getRiskStatus = (score) => {
  if (score >= 85) {
    return "CRITICAL";
  }

  if (score >= 60) {
    return "HIGH_RISK";
  }

  if (score >= 30) {
    return "MEDIUM_RISK";
  }

  return "LOW_RISK";
};

const getRiskTrend = (previousRisk, currentRisk) => {
  if (currentRisk > previousRisk) {
    return "INCREASING";
  }

  if (currentRisk < previousRisk) {
    return "DECREASING";
  }

  return "STABLE";
};

const calculateReputationScore = (profile, currentRisk) => {
  const averageRisk = profile.averageRisk || 0;
  const blockedEventScore = Math.min(profile.totalBlockedEvents * 5, 25);

  const behaviorEventScore = Math.min(profile.totalBehaviorEvents * 2, 20);

  const reputationScore =
    currentRisk * 0.4 +
    averageRisk * 0.3 +
    blockedEventScore +
    behaviorEventScore;

  return Math.min(Math.max(Math.round(reputationScore), 0), 100);
};

const updateRiskProfile = async ({ ipAddress, behaviorResult }) => {
  const currentRisk = behaviorResult.riskScore || 0;
  const behaviorDetected = behaviorResult.detected === true;
  const wasBlocked = behaviorResult.action === "BLOCK";

  let profile = await RiskProfile.findOne({ ipAddress });

  if (!profile) {
    profile = new RiskProfile({
      ipAddress,
    });
  }

  const previousRisk = profile.currentRisk || 0;

  profile.totalRequests += 1;
  profile.previousRisk = previousRisk;
  profile.currentRisk = currentRisk;
  profile.lastSeen = new Date();

  if (behaviorDetected) {
    profile.totalBehaviorEvents += 1;
    profile.cumulativeRisk += currentRisk;
    profile.lastBehaviorTypes = behaviorResult.behaviorTypes || [];
  }

  if (wasBlocked) {
    profile.totalBlockedEvents += 1;
  }

  if (profile.totalBehaviorEvents > 0) {
    profile.averageRisk = Math.round(
      profile.cumulativeRisk / profile.totalBehaviorEvents,
    );
  } else {
    profile.averageRisk = 0;
  }

  profile.riskTrend = getRiskTrend(previousRisk, currentRisk);

  profile.reputationScore = calculateReputationScore(profile, currentRisk);

  profile.status = getRiskStatus(profile.reputationScore);

  await profile.save();

  return profile;
};

module.exports = {
  updateRiskProfile,
};
