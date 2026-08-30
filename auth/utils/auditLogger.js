const SecurityAuditLog = require("../models/SecurityAuditLog");

const logSecurityEvent = async ({
  event,
  userId = null,
  email = null,
  req = null,
  details = null,
}) => {
  try {
    await SecurityAuditLog.create({
      event,
      userId,
      email,
      ipAddress: req?.ip || null,
      userAgent: req?.get("user-agent") || null,
      details,
    });
  } catch (error) {
    // Audit logging must never break authentication.
    console.error("Security audit logging error:", error.message);
  }
};

module.exports = {
  logSecurityEvent,
};