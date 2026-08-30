require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const authenticateUser = require("./middleware/authenticateUser");
const authorizeRoles = require("./middleware/authorizeRoles");
const { adminRateLimiter } = require("./middleware/rateLimiters");

const app = express();
const demoRoutes = require("./routes/demoRoutes");

app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(
  express.json({
    limit: "10kb",
  })
);
app.use("/api", demoRoutes);

app.use("/api/auth", authRoutes);

app.get("/api/public", (req, res) => {
  res.status(200).json({
    message: "EvoGuard Authentication API is running",
  });
});

app.get(
  "/api/admin/dashboard",
  authenticateUser,
  authorizeRoles("ADMIN"),
  adminRateLimiter,
  (req, res) => {
    res.status(200).json({
      message: "Admin dashboard accessed successfully",
      user: req.user,
    });
  }
);

app.get("/api/profile", authenticateUser, (req, res) => {
  res.status(200).json({
    message: "Profile retrieved successfully",
    user: req.user,
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled application error:", err.message);

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      message: "Invalid JSON payload",
    });
  }

  res.status(err.status || 500).json({
    message: "An internal server error occurred",
  });
});

module.exports = app;