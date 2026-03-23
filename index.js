require("dotenv").config();
const express = require("express");
const cors = require("cors");
const solarRoutes = require("./routes/solar");
const satelliteRoutes = require("./routes/satellite");
const oracleRoutes = require("./routes/oracle");
const logger = require("./utils/logger");
const morganMiddleware = require("./utils/morgan");
const oracleCron = require("./utils/oracleCron");

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
app.use("/api/oracle", oracleRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  logger.info("Health check endpoint called");
  res.status(200).json({ message: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
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

  // Start the oracle cron if enabled (default: true)
  const cronEnabled =
    (process.env.ORACLE_CRON_ENABLED || "true").toLowerCase() !== "false";

  if (cronEnabled) {
    oracleCron.start();
  } else {
    logger.info("Oracle cron auto-start is disabled (ORACLE_CRON_ENABLED=false)");
  }
});

// ─── Graceful shutdown ───────────────────────────────────────────────────────
const shutdown = (signal) => {
  logger.info(`\n${signal} received — shutting down gracefully...`);
  oracleCron.stop();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
