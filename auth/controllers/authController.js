const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { logSecurityEvent } = require("../utils/auditLogger");

const {
  MAX_FAILED_LOGIN_ATTEMPTS,
  ACCOUNT_LOCK_DURATION_MS,
} = require("../config/lockout");
const SALT_ROUNDS = 12;

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      await logSecurityEvent({
      event: "REGISTER_DUPLICATE",
      email: normalizedEmail,
     req,
      details: "Registration attempted with an existing email",
    });

  return res.status(409).json({
  message: "An account with this email already exists",
});}
     
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "CUSTOMER",
    });
    await logSecurityEvent({
    event: "REGISTER_SUCCESS",
    userId: user._id,
    email: user.email,
    req,
    });

    return res.status(201).json({
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } 
  catch (error) {
    console.error("Registration error:", error.message);

    return res.status(500).json({
      message: "Unable to complete registration",
    });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Check whether the account is currently locked.
    if (
      user.accountLockedUntil &&
      user.accountLockedUntil > new Date()
    ) {
      return res.status(423).json({
        message: "Account temporarily locked. Please try again later.",
      });
    }

    // If the lock period has expired, reset the lock state.
    if (
      user.accountLockedUntil &&
      user.accountLockedUntil <= new Date()
    ) {
      user.accountLockedUntil = null;
      user.failedLoginAttempts = 0;

      await user.save();
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    // Incorrect password
    if (!passwordMatches) {
      user.failedLoginAttempts += 1;

      await logSecurityEvent({
        event: "LOGIN_FAILED",
        userId: user._id,
        email: user.email,
        req,
        details: `Failed login attempt ${user.failedLoginAttempts}`,
      });

      // Lock account after the configured number of failures.
      if (
        user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS
      ) {
        user.accountLockedUntil = new Date(
          Date.now() + ACCOUNT_LOCK_DURATION_MS
        );

        await user.save();

        await logSecurityEvent({
          event: "ACCOUNT_LOCKED",
          userId: user._id,
          email: user.email,
          req,
          details: `Account locked after ${user.failedLoginAttempts} failed login attempts`,
        });

        return res.status(423).json({
          message: "Account temporarily locked. Please try again later.",
        });
      }

      await user.save();

      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Successful login resets failed attempts.
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;

    await user.save();

    // Record successful login.
    await logSecurityEvent({
      event: "LOGIN_SUCCESS",
      userId: user._id,
      email: user.email,
      req,
    });

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Unable to complete login",
    });
  }
};

module.exports = {
  register,
  login,
};