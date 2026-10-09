const XAI_SERVICE_URL =
  process.env.XAI_SERVICE_URL || "http://127.0.0.1:8000";

const getXaiPrediction = async (features) => {
  try {
    const response = await fetch(`${XAI_SERVICE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(features),
      signal: AbortSignal.timeout(2000),
    });

    if (!response.ok) {
      throw new Error(`XAI service returned HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("XAI service unavailable:", error.message);

    // Graceful fallback:
    // XAI failure must not stop the main EvoGuard request pipeline.
    return {
      classification: "UNAVAILABLE",
      anomalyScore: null,
      riskContribution: 0,
      confidence: null,
      reasons: ["XAI analysis unavailable."],
      importantFeatures: [],
    };
  }
};

module.exports = getXaiPrediction;