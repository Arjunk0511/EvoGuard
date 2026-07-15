const extractRequestData = require("../security/requestExtractor");
const runDetectors = require("../security/detectorRunner");
const AttackLog = require("../models/AttackLog");

const idsMiddleware = async (req, res, next) => {
  try {
    const requestData = extractRequestData(req);

    const detectionResult = runDetectors(requestData);

    req.idsContext = {
      requestData,
      detectionResult,
    };

    console.log("IDS middleware checked:", {
      method: requestData.method,
      endpoint: requestData.endpoint,
      detected: detectionResult.detected,
      riskScore: detectionResult.riskScore,
      attackTypes: detectionResult.attackTypes,
      action: detectionResult.action,
    });

    // Save only MONITOR and BLOCK events
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

    // Stop blocked requests here
    if (detectionResult.action === "BLOCK") {
      return res.status(403).json({
        success: false,
        error: {
          code: "REQUEST_BLOCKED",
          message: "Suspicious request detected and blocked.",
        },
        detection: {
          attackTypes: detectionResult.attackTypes,
          riskScore: detectionResult.riskScore,
          reasons: detectionResult.reasons,
        },
      });
    }

    // ALLOW and MONITOR requests continue
    next();
  } catch (error) {
    console.error("IDS middleware error:", error.message);

    // IDS failure should not crash the whole application
    next();
  }
};

module.exports = idsMiddleware;
