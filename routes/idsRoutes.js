const express = require("express");
const AttackLog = require("../models/AttackLog");

const router = express.Router();

router.get("/logs", async (req, res) => {
  try {
    const logs = await AttackLog.find().sort({ createdAt: -1 }).limit(50);

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error("Failed to fetch attack logs:", error.message);

    return res.status(500).json({
      success: false,
      error: {
        code: "LOG_FETCH_FAILED",
        message: "Failed to fetch attack logs.",
      },
    });
  }
});

module.exports = router;
