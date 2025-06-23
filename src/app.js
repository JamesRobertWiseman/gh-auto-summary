import express from "express";
import { config, validateConfig } from "./config/index.js";
import authRoutes from "./routes/auth.js";
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

app.get("/", (req, res) => {
  res.json({
    name: config.app.name,
    version: config.app.version,
    description:
      "A GitHub App that automatically generates PR summaries and changelogs using GitHub Copilot",
    installation_url: `https://github.com/apps/${config.github.appSlug}/installations/new`,
    documentation:
      "Add [GHAutoSummary] to your PR title or description to trigger automatic summary generation",
    features: [
      "🤖 Automatic PR summaries with [GHAutoSummary] tag",
      "📝 Structured changelogs with conventional commit support",
      "🎯 Smart analysis using GitHub Copilot API",
      "⚡ Real-time webhook processing",
    ],
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
app.use("/auth", authRoutes);

app.use("*", (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

export default app;
