const express = require("express");
const axios = require("axios");
const BehavioralSession = require("../models/BehavioralSession");

const router = express.Router();

const INTELLIGENCE_SERVICE_URL =
  process.env.INTELLIGENCE_SERVICE_URL || "http://127.0.0.1:5001";

// POST /api/behavior/collect
// Used ONLY during dataset building. Body: { sessionId, label, events }.
// The frontend collector flushes every few seconds, so a session arrives
// as several POSTs sharing one sessionId — we append rather than overwrite.
router.post("/collect", async (req, res) => {
  const { sessionId, label, events = [] } = req.body;

  if (!sessionId || !label) {
    return res.status(400).json({
      success: false,
      error: { code: "MISSING_FIELDS", message: "sessionId and label are required." },
    });
  }

  if (!["human", "bot"].includes(label)) {
    return res.status(400).json({
      success: false,
      error: { code: "INVALID_LABEL", message: "label must be 'human' or 'bot'." },
    });
  }

  try {
    await BehavioralSession.findOneAndUpdate(
      { sessionId },
      {
        $push: { events: { $each: events } },
        $setOnInsert: { label, source: req.body.source || "data_collection" },
        $set: { updatedAt: new Date() },
      },
      { upsert: true, new: true }
    );

    return res.status(202).json({ success: true, status: "stored" });
  } catch (error) {
    console.error("Failed to store behavioral session:", error.message);
    return res.status(500).json({
      success: false,
      error: { code: "STORE_FAILED", message: "Failed to store behavioral session." },
    });
  }
});

// GET /api/behavior/stats — quick check on how much labeled data exists
router.get("/stats", async (_req, res) => {
  try {
    const human = await BehavioralSession.countDocuments({ label: "human" });
    const bot = await BehavioralSession.countDocuments({ label: "bot" });
    return res.status(200).json({ success: true, data: { human, bot } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: "STATS_FAILED", message: "Failed to fetch stats." },
    });
  }
});

// POST /api/behavior/predict
// Live scoring: forwards raw events to the Flask intelligence_service and
// returns its behavioral risk result. Not used during dataset building.
router.post("/predict", async (req, res) => {
  const { events } = req.body;

  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: "MISSING_EVENTS", message: "'events' must be a non-empty array." },
    });
  }

  try {
    const response = await axios.post(
      `${INTELLIGENCE_SERVICE_URL}/api/predict`,
      { events },
      { timeout: 5000 }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Intelligence service request failed:", error.message);
    return res.status(502).json({
      success: false,
      error: {
        code: "INTELLIGENCE_SERVICE_UNAVAILABLE",
        message: "Could not reach the behavioral intelligence service.",
      },
    });
  }
});

module.exports = router;