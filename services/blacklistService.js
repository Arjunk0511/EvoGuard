const BlacklistedIP = require("../models/BlacklistedIP");

const findActiveBlacklistedIP = async (ipAddress) => {
  if (!ipAddress) {
    return null;
  }

  const blacklistedIP = await BlacklistedIP.findOne({
    ipAddress,
    isActive: true,
  });

  return blacklistedIP;
};

const addIPToBlacklist = async ({
  ipAddress,
  reason,
  riskScore,
  riskStatus,
  behaviorTypes = [],
  expiresAt = null,
}) => {
  if (!ipAddress) {
    throw new Error("IP address is required for blacklisting.");
  }

  const blacklistedIP = await BlacklistedIP.findOneAndUpdate(
    { ipAddress },
    {
      $set: {
        reason,
        riskScore,
        riskStatus,
        behaviorTypes,
        isActive: true,
        blacklistedAt: new Date(),
        expiresAt,
        removedAt: null,
        removalReason: null,
      },
      $setOnInsert: {
        blockedCount: 0,
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
    },
  );

  return blacklistedIP;
};

const removeIPFromBlacklist = async (
  ipAddress,
  removalReason = "Removed manually by admin.",
) => {
  if (!ipAddress) {
    throw new Error("IP address is required for blacklist removal.");
  }

  const removedIP = await BlacklistedIP.findOneAndUpdate(
    {
      ipAddress,
      isActive: true,
    },
    {
      $set: {
        isActive: false,
        removedAt: new Date(),
        removalReason,
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  return removedIP;
};

const incrementBlockedCount = async (ipAddress) => {
  if (!ipAddress) {
    return null;
  }

  const updatedIP = await BlacklistedIP.findOneAndUpdate(
    {
      ipAddress,
      isActive: true,
    },
    {
      $inc: {
        blockedCount: 1,
      },
    },
    {
      returnDocument: "after",
    },
  );

  return updatedIP;
};

const getActiveBlacklistedIPs = async () => {
  const blacklistedIPs = await BlacklistedIP.find({
    isActive: true,
  })
    .sort({
      blacklistedAt: -1,
    })
    .lean();

  return blacklistedIPs;
};

module.exports = {
  findActiveBlacklistedIP,
  addIPToBlacklist,
  removeIPFromBlacklist,
  incrementBlockedCount,
  getActiveBlacklistedIPs,
};
