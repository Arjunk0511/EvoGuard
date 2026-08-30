require("dotenv").config();

const app = require("./app");
const connectDatabase = require("./config/database");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Authentication API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server");
    process.exit(1);
  }
};

startServer();