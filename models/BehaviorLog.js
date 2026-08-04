const mongoose = require("mongoose");

const behaviorLogSchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    default: "UNKNOWN",
  },

  sessionId: {
    type: String,
    default: null,
  },

  endpoint: {
    type: String,
    required: true,
  },

  method: {
    type: String,
    required: true,
  },

  behaviorTypes: {
    type: [String],
    default: [],
  },

  metrics: {
    totalRequests: {
      type: Number,
      default: 0,
    },

    requestsInWindow: {
      type: Number,
      default: 0,
    },

    requestsInFiveSeconds: {
      type: Number,
      default: 0,
    },

    uniqueEndpoints: {
      type: Number,
      default: 0,
    },

    repeatedPayloadCount: {
      type: Number,
      default: 0,
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
  },

  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },

  reasons: {
    type: [String],
    default: [],
  },

  action: {
    type: String,
    enum: ["ALLOW", "MONITOR", "BLOCK"],
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const BehaviorLog = mongoose.model("BehaviorLog", behaviorLogSchema);

module.exports = BehaviorLog;
