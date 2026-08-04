const mongoose = require("mongoose");

const blacklistedIPSchema = new mongoose.Schema(
  {
    ipAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    reason: {
      type: String,
      required: true,
    },

    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    riskStatus: {
      type: String,
      enum: ["HIGH_RISK", "CRITICAL"],
      required: true,
    },

    behaviorTypes: {
      type: [String],
      default: [],
    },

    blockedCount: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    blacklistedAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    removedAt: {
      type: Date,
      default: null,
    },

    removalReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("BlacklistedIP", blacklistedIPSchema);
