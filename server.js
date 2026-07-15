const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const idsMiddleware = require("./middleware/idsMiddleware");
const idsRoutes = require("./routes/idsRoutes");

dotenv.config();

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

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
