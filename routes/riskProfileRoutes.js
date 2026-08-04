const express = require("express");
const RiskProfile = require("../models/RiskProfile");

const router = express.Router();

// Get all risk profiles, highest reputation first
router.get("/", async (req, res) => {
  try {
    const profiles = await RiskProfile.find()
      .sort({
        reputationScore: -1,
        lastSeen: -1,
      })
      .limit(50);

    return res.status(200).json({
      success: true,
      count: profiles.length,
      data: profiles,
    });
  } catch (error) {
    console.error("Failed to fetch risk profiles:", error.message);

    return res.status(500).json({
      success: false,
      error: {
        code: "RISK_PROFILE_FETCH_FAILED",
        message: "Failed to fetch risk profiles.",
      },
    });
  }
});

// Get one risk profile by IP address
router.get("/:ipAddress", async (req, res) => {
  try {
    const profile = await RiskProfile.findOne({
      ipAddress: req.params.ipAddress,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RISK_PROFILE_NOT_FOUND",
          message: "Risk profile not found.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Failed to fetch risk profile:", error.message);

    return res.status(500).json({
      success: false,
      error: {
        code: "RISK_PROFILE_FETCH_FAILED",
        message: "Failed to fetch risk profile.",
      },
    });
  }
});

module.exports = router;
