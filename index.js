require("dotenv").config();
const express = require("express");
const cors = require("cors");
const solarRoutes = require("./routes/solar");
const satelliteRoutes = require("./routes/satellite");
const logger = require("./utils/logger");
const morganMiddleware = require("./utils/morgan");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morganMiddleware);

// Routes
app.use("/api/solar", solarRoutes);
app.use("/api/satellite", satelliteRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  logger.info("Health check endpoint called");
  res.status(200).json({ message: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {readings;
  logger.error("Unhandled error:", {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
  });
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use((req, res) => {
  logger.warn("Route not found", {
    method: req.method,
    url: req.url,
  });
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
