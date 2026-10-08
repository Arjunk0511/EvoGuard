const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const idsMiddleware = require("./middleware/idsMiddleware");
const idsRoutes = require("./routes/idsRoutes");
const behaviorRoutes = require("./routes/behaviorRoutes");

dotenv.config();

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Dataset parser must run before the general body parser.
app.use("/api/behavior/dataset/v2", require("./routes/behaviorDatasetRoutes"));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Health route is excluded from IDS
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "EvoGuard IDS backend is running.",
  });
});

// IDS logs route must be mounted before IDS middleware
app.use("/api/ids", idsRoutes);

// Behavioral data-collection/prediction traffic is also excluded from
// the rule-based IDS middleware — it's high-volume telemetry, not
// application traffic to inspect for injection/XSS patterns.
app.use("/api/behavior", behaviorRoutes);

// Apply IDS middleware to remaining API routes
app.use("/api", idsMiddleware);

app.get("/api/products", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Normal request reached the products route.",
    idsContext: req.idsContext,
    data: [],
  });
});

app.listen(PORT, () => {
  console.log(`EvoGuard IDS backend running on port ${PORT}`);
});