const mongoose = require("mongoose");

const behavioralEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["mousemove", "mousedown", "mouseup", "click", "keydown", "keyup"],
      required: true,
    },
    timestamp: { type: Number, required: true },
    x: Number,
    y: Number,
    code: String, // physical key position only (e.g. "KeyA"), never the typed character
  },
  { _id: false }
);

const behavioralSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },

  label: {
    type: String,
    enum: ["human", "bot"],
    required: true,
  },

  events: {
    type: [behavioralEventSchema],
    default: [],
  },

  source: {
    type: String,
    default: "data_collection", // 'data_collection' | 'selenium_bot' | 'playwright_bot'
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const BehavioralSession = mongoose.model(
  "BehavioralSession",
  behavioralSessionSchema
);

module.exports = BehavioralSession;