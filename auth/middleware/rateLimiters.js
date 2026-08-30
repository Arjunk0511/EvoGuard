const rateLimit = require("express-rate-limit");

const {
  LOGIN_RATE_LIMIT,
  REGISTER_RATE_LIMIT,
  ADMIN_RATE_LIMIT,
} = require("../config/rateLimit");

const loginRateLimiter = rateLimit({
  windowMs: LOGIN_RATE_LIMIT.windowMs,
  limit: LOGIN_RATE_LIMIT.limit,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Please try again later.",
  },
});

const registerRateLimiter = rateLimit({
  windowMs: REGISTER_RATE_LIMIT.windowMs,
  limit: REGISTER_RATE_LIMIT.limit,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many registration attempts. Please try again later.",
  },
});

const adminRateLimiter = rateLimit({
  windowMs: ADMIN_RATE_LIMIT.windowMs,
  limit: ADMIN_RATE_LIMIT.limit,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please try again later.",
  },
});

module.exports = {
  loginRateLimiter,
  registerRateLimiter,
  adminRateLimiter,
};