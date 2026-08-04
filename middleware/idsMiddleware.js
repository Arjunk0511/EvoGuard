const {
  incrementFailedLoginAttempts,
  resetFailedLoginAttempts,
} = require("../security/behavioral/behaviorStore");

const {
  findActiveBlacklistedIP,
  incrementBlockedCount,
  addIPToBlacklist,
} = require("../services/blacklistService");

const extractRequestData = require("../security/requestExtractor");
const runDetectors = require("../security/detectorRunner");
const runBehaviorEngine = require("../security/behavioral/behaviorEngine");

const { updateRiskProfile } = require("../services/riskProfileService");

const AttackLog = require("../models/AttackLog");
const BehaviorLog = require("../models/BehaviorLog");

const idsMiddleware = async (req, res, next) => {
  try {
    const requestData = extractRequestData(req);

    /*
     * BLACKLIST CHECK
     *
     * This check runs before the Rule Engine, Behavior Engine,
     * and Risk Profile Engine.
     */
    const blacklistedIP = await findActiveBlacklistedIP(requestData.ipAddress);

    if (blacklistedIP) {
      const updatedBlacklistEntry = await incrementBlockedCount(
        requestData.ipAddress,
      );

      console.log("Blacklisted IP blocked:", {
        ipAddress: requestData.ipAddress,
        reason: blacklistedIP.reason,
        riskScore: blacklistedIP.riskScore,
        riskStatus: blacklistedIP.riskStatus,
        blockedCount:
          updatedBlacklistEntry?.blockedCount ?? blacklistedIP.blockedCount,
      });

      return res.status(403).json({
        success: false,
        error: {
          code: "IP_BLACKLISTED",
          message: "Your IP address has been blacklisted.",
        },
        blacklist: {
          ipAddress: blacklistedIP.ipAddress,
          reason: blacklistedIP.reason,
          riskScore: blacklistedIP.riskScore,
          riskStatus: blacklistedIP.riskStatus,
          behaviorTypes: blacklistedIP.behaviorTypes,
          blockedCount:
            updatedBlacklistEntry?.blockedCount ?? blacklistedIP.blockedCount,
          blacklistedAt: blacklistedIP.blacklistedAt,
          expiresAt: blacklistedIP.expiresAt,
        },
      });
    }

    // Rule-based detection
    const detectionResult = runDetectors(requestData);

    /*
     * LOGIN ATTEMPT TRACKING
     *
     * This temporary login logic tracks failed and successful
     * login attempts for brute-force detection.
     */
    if (
      requestData.method === "POST" &&
      requestData.endpoint === "/api/login"
    ) {
      const validEmail = "admin@evoguard.com";
      const validPassword = "admin123";

      const submittedEmail = requestData.body?.email;
      const submittedPassword = requestData.body?.loginPassword;

      const loginIsValid =
        submittedEmail === validEmail && submittedPassword === validPassword;

      if (loginIsValid) {
        resetFailedLoginAttempts(requestData.ipAddress);
      } else {
        incrementFailedLoginAttempts(requestData.ipAddress);
      }
    }

    // Behavior-based detection
    const behaviorResult = runBehaviorEngine(requestData);

    // Update progressive risk profile for this IP
    let riskProfile = null;

    try {
      riskProfile = await updateRiskProfile({
        ipAddress: requestData.ipAddress,
        behaviorResult,
      });

      console.log("Risk profile updated:", {
        ipAddress: riskProfile.ipAddress,
        totalRequests: riskProfile.totalRequests,
        currentRisk: riskProfile.currentRisk,
        previousRisk: riskProfile.previousRisk,
        averageRisk: riskProfile.averageRisk,
        cumulativeRisk: riskProfile.cumulativeRisk,
        reputationScore: riskProfile.reputationScore,
        riskTrend: riskProfile.riskTrend,
        totalBehaviorEvents: riskProfile.totalBehaviorEvents,
        totalBlockedEvents: riskProfile.totalBlockedEvents,
        lastBehaviorTypes: riskProfile.lastBehaviorTypes,
        status: riskProfile.status,
      });

      // Automatically blacklist dangerous IPs
      if (
        riskProfile &&
        (riskProfile.status === "HIGH_RISK" ||
          riskProfile.status === "CRITICAL")
      ) {
        await addIPToBlacklist({
          ipAddress: requestData.ipAddress,
          reason: `Automatically blacklisted due to ${riskProfile.status} reputation.`,
          riskScore: riskProfile.currentRisk,
          riskStatus: riskProfile.status,
          behaviorTypes: behaviorResult.behaviorTypes,
        });

        console.log("IP automatically added to blacklist:", {
          ipAddress: requestData.ipAddress,
          status: riskProfile.status,
          reputationScore: riskProfile.reputationScore,
          currentRisk: riskProfile.currentRisk,
        });
      }
    } catch (riskProfileError) {
      console.error("Failed to update risk profile:", riskProfileError.message);
    }

    req.idsContext = {
      requestData,
      detectionResult,
      behaviorResult,
      riskProfile,
    };

    console.log("IDS middleware checked:", {
      method: requestData.method,
      endpoint: requestData.endpoint,

      ruleDetection: {
        detected: detectionResult.detected,
        riskScore: detectionResult.riskScore,
        attackTypes: detectionResult.attackTypes,
        action: detectionResult.action,
      },

      behaviorDetection: {
        detected: behaviorResult.detected,
        riskScore: behaviorResult.riskScore,
        behaviorTypes: behaviorResult.behaviorTypes,
        action: behaviorResult.action,
        metrics: behaviorResult.metrics,
      },
    });

    // Save rule-based attack logs
    if (
      detectionResult.action === "MONITOR" ||
      detectionResult.action === "BLOCK"
    ) {
      try {
        await AttackLog.create({
          ipAddress: requestData.ipAddress,
          method: requestData.method,
          endpoint: requestData.endpoint,
          userAgent: requestData.userAgent,
          attackTypes: detectionResult.attackTypes,
          riskScore: detectionResult.riskScore,
          reasons: detectionResult.reasons,
          action: detectionResult.action,
          requestData: {
            query: requestData.query,
            body: requestData.body,
            params: requestData.params,
          },
        });

        console.log("Attack log saved successfully.");
      } catch (loggingError) {
        console.error("Failed to save attack log:", loggingError.message);
      }
    }

    // Save suspicious behavioral events
    if (
      behaviorResult.action === "MONITOR" ||
      behaviorResult.action === "BLOCK"
    ) {
      try {
        await BehaviorLog.create({
          ipAddress: requestData.ipAddress,
          sessionId: null,
          endpoint: requestData.endpoint,
          method: requestData.method,
          behaviorTypes: behaviorResult.behaviorTypes,
          metrics: behaviorResult.metrics,
          riskScore: behaviorResult.riskScore,
          reasons: behaviorResult.reasons,
          action: behaviorResult.action,
        });

        console.log("Behavior log saved successfully.");
      } catch (behaviorLoggingError) {
        console.error(
          "Failed to save behavior log:",
          behaviorLoggingError.message,
        );
      }
    }

    // Rule-based blocking
    if (detectionResult.action === "BLOCK") {
      return res.status(403).json({
        success: false,
        error: {
          code: "REQUEST_BLOCKED",
          message: "Suspicious request detected and blocked.",
        },
        detection: {
          source: "RULE_ENGINE",
          attackTypes: detectionResult.attackTypes,
          riskScore: detectionResult.riskScore,
          reasons: detectionResult.reasons,
        },
      });
    }

    // Behavioral blocking
    if (behaviorResult.action === "BLOCK") {
      return res.status(403).json({
        success: false,
        error: {
          code: "BEHAVIOR_BLOCKED",
          message: "Suspicious behavior detected and blocked.",
        },
        detection: {
          source: "BEHAVIOR_ENGINE",
          behaviorTypes: behaviorResult.behaviorTypes,
          riskScore: behaviorResult.riskScore,
          reasons: behaviorResult.reasons,
          metrics: behaviorResult.metrics,
          riskProfile: riskProfile
            ? {
                currentRisk: riskProfile.currentRisk,
                averageRisk: riskProfile.averageRisk,
                status: riskProfile.status,
              }
            : null,
        },
      });
    }

    // ALLOW and MONITOR requests continue
    return next();
  } catch (error) {
    console.error("IDS middleware error:", error.message);

    // IDS failure should not crash the application
    return next();
  }
};

module.exports = idsMiddleware;
