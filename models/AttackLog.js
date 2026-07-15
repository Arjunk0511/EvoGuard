const mongoose = require("mongoose");

const attackLogSchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    default: "UNKNOWN",
  },

  method: {
    type: String,
    required: true,
  },

  endpoint: {
    type: String,
    required: true,
  },

  userAgent: {
    type: String,
    default: "UNKNOWN",
  },

  attackTypes: {
    type: [String],
    default: [],
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

  requestData: {
    query: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    body: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    params: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AttackLog = mongoose.model("AttackLog", attackLogSchema);

module.exports = AttackLog;
