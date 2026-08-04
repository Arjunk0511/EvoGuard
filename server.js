const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

const idsMiddleware = require("./middleware/idsMiddleware");

const idsRoutes = require("./routes/idsRoutes");
const behaviorRoutes = require("./routes/behaviorRoutes");
const riskProfileRoutes = require("./routes/riskProfileRoutes");
const blacklistRoutes = require("./routes/blacklistRoutes");

dotenv.config();

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

/*
 * GLOBAL MIDDLEWARE
 */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

/*
 * ROUTES EXCLUDED FROM IDS MIDDLEWARE
 *
 * These routes must remain accessible even when the current IP
 * has been blacklisted.
 */

// Health check
app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "EvoGuard IDS backend is running.",
  });
});

// IDS and monitoring APIs
app.use("/api/ids", idsRoutes);
app.use("/api/behavior", behaviorRoutes);
app.use("/api/risk-profiles", riskProfileRoutes);

// Blacklist management API
app.use("/api/blacklist", blacklistRoutes);

/*
 * IDS MIDDLEWARE
 *
 * Every /api route registered after this line
 * will be inspected by EvoGuard.
 */
app.use("/api", idsMiddleware);

/*
 * PROTECTED APPLICATION ROUTES
 */

app.get("/api/products", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Normal request reached the products route.",
    idsContext: req.idsContext,
    data: [],
  });
});

app.get("/api/users", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Users route reached.",
    idsContext: req.idsContext,
  });
});

app.get("/api/orders", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Orders route reached.",
    idsContext: req.idsContext,
  });
});

app.get("/api/profile", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Profile route reached.",
    idsContext: req.idsContext,
  });
});

app.get("/api/admin", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Admin route reached.",
    idsContext: req.idsContext,
  });
});

app.get("/api/settings", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Settings route reached.",
    idsContext: req.idsContext,
  });
});

app.get("/api/cart", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Cart route reached.",
    idsContext: req.idsContext,
  });
});

app.get("/api/search", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Search route reached.",
    idsContext: req.idsContext,
  });
});

app.post("/api/login", (req, res) => {
  const { email, loginPassword } = req.body;

  const validEmail = "admin@evoguard.com";
  const validPassword = "admin123";

  if (email !== validEmail || loginPassword !== validPassword) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password.",
      loginFailed: true,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Login successful.",
    loginFailed: false,
  });
});

/*
 * SERVER START
 */
app.listen(PORT, () => {
  console.log(`EvoGuard IDS backend running on port ${PORT}`);
});
