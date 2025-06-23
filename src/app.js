import express from "express";
import { config, validateConfig } from "./config/index.js";
import webhookRoutes from "./routes/webhook.js";
import { logger } from "./utils/logger.js";

try {
  validateConfig();
  logger.info("Configuration validated successfully");
} catch (error) {
  logger.error("Configuration validation failed:", error.message);
  process.exit(1);
}

const app = express();

app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err.message);
  res.status(500).json({
    error: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: config.app.version,
  });
});

app.use("/webhook", webhookRoutes);

app.use("*", (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

export default app;
