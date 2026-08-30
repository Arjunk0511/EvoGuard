const express = require("express");

const {
  register,
  login,
} = require("../controllers/authController");

const {
  loginRateLimiter,
  registerRateLimiter,
} = require("../middleware/rateLimiters");

const router = express.Router();

router.post("/register", registerRateLimiter, register);

router.post("/login", loginRateLimiter, login);

module.exports = router;