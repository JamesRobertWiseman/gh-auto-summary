import { App } from "@octokit/app";
import { config } from "../config/index.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("GitHubAppService");

export class GitHubAppService {
  constructor() {
    try {
      console.log("🔧 GitHubAppService constructor starting...");
      logger.debug(`Initializing GitHub App with ID: ${config.github.appId}`);
      logger.debug(
        `Private key length: ${
          config.github.privateKey?.length || 0
        } characters`
      );
      logger.debug(
        `Private key starts with: ${
          config.github.privateKey?.substring(0, 30) || "undefined"
        }...`
      );
      logger.debug(`Webhook secret set: ${!!config.github.webhookSecret}`);

      console.log("🔧 Creating GitHub App instance...");
      this.app = new App({
        appId: config.github.appId,
        privateKey: config.github.privateKey,
        webhooks: {
          secret: config.github.webhookSecret,
        },
      });
      console.log("✅ GitHub App instance created successfully");
      logger.debug(`GitHub App instance created successfully`);
    } catch (error) {
      console.error("❌ Error in GitHubAppService constructor:", error.message);
      logger.error("Error in GitHubAppService constructor:", error.message);
      throw error;
    }
  }

  async getInstallationOctokit(installationId) {
    try {
      logger.debug(
        `Getting installation octokit for installation ID: ${installationId}`
      );

      // Validate installation ID
      if (!installationId) {
        throw new Error("Installation ID is required");
      }

      logger.debug(
        `Calling this.app.getInstallationOctokit(${installationId})...`
      );
      const installationOctokit = await this.app.getInstallationOctokit(
        installationId
      );

      logger.debug(`Installation octokit created successfully`);
      logger.debug(`Octokit auth type: ${typeof installationOctokit?.auth}`);

      return installationOctokit;
    } catch (error) {
      logger.error(
        `Failed to get installation octokit for ${installationId}:`,
        error.message
      );
      logger.error(`Error stack:`, error.stack);
      throw error;
    }
  }

  async getInstallationId(owner, repo) {
    try {
      const { data: installation } = await this.app.octokit.request(
        "GET /repos/{owner}/{repo}/installation",
        { owner, repo }
      );
      return installation.id;
    } catch (error) {
      logger.error(
        `Failed to get installation for ${owner}/${repo}:`,
        error.message
      );
      throw error;
    }
  }

  async getInstallations() {
    try {
      const { data } = await this.app.octokit.request("GET /app/installations");
      return data;
    } catch (error) {
      logger.error("Failed to get installations:", error.message);
      throw error;
    }
  }

  async getInstallation(installationId) {
    try {
      const { data } = await this.app.octokit.request(
        "GET /app/installations/{installation_id}",
        { installation_id: installationId }
      );
      return data;
    } catch (error) {
      logger.error(
        `Failed to get installation ${installationId}:`,
        error.message
      );
      throw error;
    }
  }

  async verifyAndReceive(payload, signature) {
    try {
      await this.app.webhooks.verifyAndReceive({
        id: payload.headers["x-github-delivery"],
        name: payload.headers["x-github-event"],
        signature,
        payload: JSON.stringify(payload.body),
      });
    } catch (error) {
      logger.error("Failed to verify webhook:", error.message);
      throw error;
    }
  }
}

// Create singleton instance with error handling
let githubAppService;
try {
  console.log("🚀 Creating GitHubAppService singleton...");
  githubAppService = new GitHubAppService();
  console.log("✅ GitHubAppService singleton created successfully");
} catch (error) {
  console.error(
    "❌ Failed to create GitHubAppService singleton:",
    error.message
  );
  console.error("Error stack:", error.stack);
  throw error;
}

export { githubAppService };
