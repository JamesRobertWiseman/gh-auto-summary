import "./debug-env.js";
import app from "./src/app.js";
import { config } from "./src/config/index.js";
import { logger } from "./src/utils/logger.js";

// For local development
if (process.env.NODE_ENV !== "production") {
  const port = config.port;

  // Graceful shutdown handling
  process.on("SIGTERM", () => {
    logger.info("SIGTERM received, shutting down gracefully");
    process.exit(0);
  });

  process.on("SIGINT", () => {
    logger.info("SIGINT received, shutting down gracefully");
    process.exit(0);
  });

  // Start server for local development
  const server = app.listen(port, () => {
    logger.info(`${config.app.name} v${config.app.version}`);
    logger.info(`Server running on port ${port}`);
    logger.info(`Health check available at http://localhost:${port}/health`);
    logger.info(
      `Webhook endpoint available at http://localhost:${port}/webhook`
    );
    logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
  });

  // Handle server errors
  server.on("error", (error) => {
    logger.error("Server error:", error.message);
    process.exit(1);
  });
}

// Export the app for Vercel
export default app;
