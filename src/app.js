import express from "express";
import { authRouter } from "./routes/auth.js";
import { copilotRouter } from "./routes/copilot.js";
import { createLogger } from "./utils/logger.js";

const app = express();
const logger = createLogger("App");

// Basic middleware
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    message: "GitHub Auto Summary Copilot Agent is running",
    mode: "copilot-agent",
    timestamp: new Date().toISOString(),
  });
});

// Copilot Extension routes - main agent endpoint
app.use("/copilot", copilotRouter);

// Auth routes for OAuth setup (still needed for GitHub App)
app.use("/auth", authRouter);

logger.info("🤖 GitHub Auto Summary Copilot Agent configured");

// Global error handler
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err.message);
  logger.error("Error stack:", err.stack);

  res.status(500).json({
    error: "Internal server error",
    message: "An unexpected error occurred",
  });
});

// 404 handler
app.use("*", (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: "Not found",
    message: "The requested endpoint does not exist",
  });
});

export { app };
