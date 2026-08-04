const express = require("express");
const BehaviorLog = require("../models/BehaviorLog");

const router = express.Router();

router.get("/logs", async (req, res) => {
  try {
    const logs = await BehaviorLog.find()
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error("Failed to fetch behavior logs:", error.message);

    return res.status(500).json({
      success: false,
      error: {
        code: "BEHAVIOR_LOG_FETCH_FAILED",
        message: "Failed to fetch behavioral logs.",
      },
    });
  }
});

module.exports = router;