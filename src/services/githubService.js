import { createLogger } from "../utils/logger.js";
import { githubAppService } from "./githubAppService.js";

const logger = createLogger("GitHubService");

export class GitHubService {
  constructor(installationId = null) {
    this.installationId = installationId;
    this.userToken = null; // For Copilot Extension mode
  }

  /**
   * Set a user token for Copilot Extension mode
   * @param {string} token - The X-GitHub-Token from Copilot platform
   */
  setUserToken(token) {
    this.userToken = token;
    logger.debug("User token set for Copilot Extension mode");
  }

  async getOctokit() {
    // If we have a user token (Copilot Extension mode), use it directly
    if (this.userToken) {
      const { Octokit } = await import("@octokit/core");
      return new Octokit({
        auth: this.userToken,
      });
    }

    // Otherwise, use installation-based authentication
    if (!this.installationId) {
      throw new Error("Installation ID is required for GitHub App mode");
    }

    try {
      return await githubAppService.getInstallationOctokit(this.installationId);
    } catch (error) {
      logger.error("Failed to get installation octokit:", error.message);
      throw error;
    }
  }

  async getInstallationToken() {
    // If we're in Copilot Extension mode, we don't need installation tokens
    if (this.userToken) {
      return this.userToken;
    }

    try {
      logger.debug(
        `Getting installation token for installation: ${this.installationId}`
      );

      // Use the GitHub App service directly to make a direct API call
      // This bypasses the problematic auth function in @octokit/auth-app
      const jwtToken = await githubAppService.app.octokit.auth({ type: "app" });

      const response = await fetch(
        `https://api.github.com/app/installations/${this.installationId}/access_tokens`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwtToken.token}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "GitHub-Auto-Summary-App",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();

      if (!data.token) {
        throw new Error("No token received from GitHub API");
      }

      logger.debug(
        "Successfully obtained installation token via direct API call"
      );
      return data.token;
    } catch (error) {
      logger.error("Failed to get installation token:", error.message);
      logger.error("Error stack:", error.stack);
      throw error;
    }
  }

  async getPullRequest(owner, repo, prNumber) {
    try {
      const octokit = await this.getOctokit();
      logger.debug(`Getting PR #${prNumber} for ${owner}/${repo}`);

      const { data } = await octokit.request(
        "GET /repos/{owner}/{repo}/pulls/{pull_number}",
        {
          owner,
          repo,
          pull_number: prNumber,
        }
      );

      logger.debug(`Successfully retrieved PR #${prNumber}`);
      return data;
    } catch (error) {
      logger.error(`Failed to get PR #${prNumber}:`, error.message);
      throw error;
    }
  }

  async getPullRequestDiff(owner, repo, prNumber) {
    try {
      const octokit = await this.getOctokit();
      logger.debug(`Getting diff for PR #${prNumber} in ${owner}/${repo}`);

      const { data } = await octokit.request(
        "GET /repos/{owner}/{repo}/pulls/{pull_number}",
        {
          owner,
          repo,
          pull_number: prNumber,
          headers: {
            accept: "application/vnd.github.v3.diff",
          },
        }
      );

      logger.debug(`Successfully retrieved diff for PR #${prNumber}`);
      return data;
    } catch (error) {
      logger.error(`Failed to get diff for PR #${prNumber}:`, error.message);
      throw error;
    }
  }

  async getPullRequestCommits(owner, repo, prNumber) {
    try {
      const octokit = await this.getOctokit();
      logger.debug(`Getting commits for PR #${prNumber} in ${owner}/${repo}`);

      const { data } = await octokit.request(
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/commits",
        {
          owner,
          repo,
          pull_number: prNumber,
        }
      );

      // Format commits consistently
      const formattedCommits = data.map((commit) => ({
        sha: commit.sha.substring(0, 7),
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
      }));

      logger.debug(
        `Successfully retrieved ${formattedCommits.length} commits for PR #${prNumber}`
      );
      return formattedCommits;
    } catch (error) {
      logger.error(`Failed to get commits for PR #${prNumber}:`, error.message);
      throw error;
    }
  }

  async updatePullRequest(owner, repo, prNumber, updates) {
    try {
      const octokit = await this.getOctokit();
      logger.debug(`Updating PR #${prNumber} in ${owner}/${repo}`);

      const { data } = await octokit.request(
        "PATCH /repos/{owner}/{repo}/pulls/{pull_number}",
        {
          owner,
          repo,
          pull_number: prNumber,
          ...updates,
        }
      );

      logger.info(`Successfully updated PR #${prNumber}`);
      return data;
    } catch (error) {
      logger.error(`Failed to update PR #${prNumber}:`, error.message);
      throw error;
    }
  }

  async getUserInfo() {
    try {
      const octokit = await this.getOctokit();
      logger.debug("Getting user info");

      const { data } = await octokit.request("GET /user");

      logger.debug(`Successfully retrieved user info for ${data.login}`);
      return data;
    } catch (error) {
      logger.error("Failed to get user info:", error.message);
      throw error;
    }
  }

  async getRepository(owner, repo) {
    try {
      const octokit = await this.getOctokit();
      logger.debug(`Getting repository info for ${owner}/${repo}`);

      const { data } = await octokit.request("GET /repos/{owner}/{repo}", {
        owner,
        repo,
      });

      logger.debug(
        `Successfully retrieved repository info for ${owner}/${repo}`
      );
      return data;
    } catch (error) {
      logger.error(
        `Failed to get repository info for ${owner}/${repo}:`,
        error.message
      );
      throw error;
    }
  }

  static async createForRepository(owner, repo) {
    const installationId = await githubAppService.getInstallationId(
      owner,
      repo
    );
    return new GitHubService(installationId);
  }
}

export const githubService = new GitHubService();
