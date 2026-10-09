const buildXaiFeatures = (requestData, detectionResult) => {
  const requestPayload = JSON.stringify({
    query: requestData.query || {},
    body: requestData.body || {},
    params: requestData.params || {},
  });

  const requestSize = Buffer.byteLength(requestPayload, "utf8");

  return {
    // Temporary development fallbacks.
    // These values are not yet collected by the Node IDS.
    requestFrequency: 0,
    failedLoginCount: 0,
    mouseEntropy: 0,
    typingVariance: 0,

    // Values genuinely available from the current IDS pipeline.
    requestSize,
    ruleRisk: detectionResult.riskScore || 0,
  };
};

module.exports = buildXaiFeatures;