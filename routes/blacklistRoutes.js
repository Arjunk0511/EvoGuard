const express = require("express");

const {
  getActiveBlacklistedIPs,
  removeIPFromBlacklist,
} = require("../services/blacklistService");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const blacklistedIPs = await getActiveBlacklistedIPs();

    return res.status(200).json({
      success: true,
      count: blacklistedIPs.length,
      data: blacklistedIPs,
    });
  } catch (error) {
    console.error("Failed to fetch blacklist:", error.message);

    return res.status(500).json({
      success: false,
      error: {
        code: "BLACKLIST_FETCH_FAILED",
        message: "Failed to fetch blacklisted IPs.",
      },
    });
  }
});

router.post("/remove", async (req, res) => {
  try {
    const { ipAddress, removalReason } = req.body;

    if (!ipAddress) {
      return res.status(400).json({
        success: false,
        error: {
          code: "IP_ADDRESS_REQUIRED",
          message: "IP address is required.",
        },
      });
    }

    const removedIP = await removeIPFromBlacklist(
      ipAddress,
      removalReason || "Removed manually by admin.",
    );

    if (!removedIP) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ACTIVE_BLACKLIST_ENTRY_NOT_FOUND",
          message: "No active blacklist entry was found for this IP.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "IP removed from blacklist successfully.",
      data: removedIP,
    });
  } catch (error) {
    console.error("Failed to remove IP from blacklist:", error.message);

    return res.status(500).json({
      success: false,
      error: {
        code: "BLACKLIST_REMOVE_FAILED",
        message: "Failed to remove IP from blacklist.",
      },
    });
  }
});

module.exports = router;
