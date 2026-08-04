const mongoose = require("mongoose");

const riskProfileSchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  totalRequests: {
    type: Number,
    default: 0,
  },

  totalBehaviorEvents: {
    type: Number,
    default: 0,
  },

  totalBlockedEvents: {
    type: Number,
    default: 0,
  },

  currentRisk: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },

  previousRisk: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },

  averageRisk: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },

  cumulativeRisk: {
    type: Number,
    default: 0,
  },

  reputationScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },

  riskTrend: {
    type: String,
    enum: ["STABLE", "INCREASING", "DECREASING"],
    default: "STABLE",
  },

  lastBehaviorTypes: {
    type: [String],
    default: [],
  },

  status: {
    type: String,
    enum: ["LOW_RISK", "MEDIUM_RISK", "HIGH_RISK", "CRITICAL"],
    default: "LOW_RISK",
  },

  firstSeen: {
    type: Date,
    default: Date.now,
  },

  lastSeen: {
    type: Date,
    default: Date.now,
  },
});

const RiskProfile = mongoose.model("RiskProfile", riskProfileSchema);

module.exports = RiskProfile;
