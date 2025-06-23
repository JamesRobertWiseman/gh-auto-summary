import { app } from "./src/app.js";
import { config, validateConfig } from "./src/config/index.js";
import { createLogger } from "./src/utils/logger.js";

const logger = createLogger("Index");

async function startServer() {
  try {
    // Validate configuration
    validateConfig();
    logger.info("Configuration validated successfully");

    // Log the current mode
    if (config.copilot.enabled) {
      logger.info("🤖 Starting in Copilot Extension mode");
      if (config.copilot.oidc.enabled) {
        logger.info("🔐 OIDC authentication enabled");
      }
    } else {
      logger.info("🔗 Starting in webhook mode");
    }

    // Start the server
    const port = config.port;
    app.listen(port, () => {
      logger.info(`🚀 Server running on port ${port}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`🎯 AI Provider: ${config.ai.provider}`);

      if (config.copilot.enabled) {
        logger.info("🤖 Copilot Extension endpoints:");
        logger.info(`   - Agent: POST /copilot/agent`);
        if (config.copilot.oidc.enabled) {
          logger.info(`   - Token Exchange: POST /copilot/token-exchange`);
        }
        logger.info(`   - Health: GET /copilot/health`);
      } else {
        logger.info("🔗 Webhook endpoints:");
        logger.info(`   - Webhook: POST /webhook`);
        logger.info(`   - Auth Callback: GET /auth/callback`);
        logger.info(
          `   - Installation Callback: GET /auth/installation/callback`
        );
      }
    });
  } catch (error) {
    logger.error("Failed to start server:", error.message);
    logger.error("Error details:", error.stack);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  logger.info("Received SIGINT, shutting down gracefully");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", error.message);
  logger.error("Error stack:", error.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled promise rejection:", reason);
  logger.error("Promise:", promise);
  process.exit(1);
});

// Start the server
startServer();
