const mongoose = require("mongoose");

const securityAuditLogSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      enum: [
        "REGISTER_SUCCESS",
        "REGISTER_DUPLICATE",
        "LOGIN_SUCCESS",
        "LOGIN_FAILED",
        "ACCOUNT_LOCKED",
        "AUTHENTICATION_FAILED",
        "AUTHORIZATION_FAILED",
      ],
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    email: {
      type: String,
      default: null,
    },

    ipAddress: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },

    details: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "SecurityAuditLog",
  securityAuditLogSchema
);