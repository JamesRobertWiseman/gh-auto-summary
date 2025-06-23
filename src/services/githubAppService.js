import { App } from "@octokit/app";
import { config } from "../config/index.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("GitHubAppService");

export class GitHubAppService {
  constructor() {
    this.app = new App({
      appId: config.github.appId,
      privateKey: config.github.privateKey,
      webhooks: {
        secret: config.github.webhookSecret,
      },
    });
  }

  async getInstallationOctokit(installationId) {
    try {
      const installationOctokit = await this.app.getInstallationOctokit(
        installationId
      );
      return installationOctokit;
    } catch (error) {
      logger.error(
        `Failed to get installation octokit for ${installationId}:`,
        error.message
      );
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

export const githubAppService = new GitHubAppService();
