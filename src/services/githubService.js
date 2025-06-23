import { createLogger } from "../utils/logger.js";
import { githubAppService } from "./githubAppService.js";

const logger = createLogger("GitHubService");

export class GitHubService {
  constructor(installationId) {
    this.installationId = installationId;
    this.octokit = null;
  }

  async getOctokit() {
    if (!this.octokit) {
      this.octokit = await githubAppService.getInstallationOctokit(
        this.installationId
      );
    }
    return this.octokit;
  }

  async getInstallationToken() {
    const octokit = await this.getOctokit();

    if (typeof octokit.auth === "function") {
      const auth = await octokit.auth();
      return auth.token;
    }
    return octokit.auth.token;
  }

  async getUser() {
    try {
      const octokit = await this.getOctokit();
      const response = await octokit.request("GET /user");
      return response.data;
    } catch (error) {
      logger.error("Failed to get user information:", error.message);
      throw error;
    }
  }

  async getPullRequestDiff(owner, repo, pullNumber) {
    try {
      logger.debug(`Fetching diff for PR #${pullNumber} in ${owner}/${repo}`);
      const octokit = await this.getOctokit();

      const { data } = await octokit.request(
        "GET /repos/{owner}/{repo}/pulls/{pull_number}",
        {
          owner,
          repo,
          pull_number: pullNumber,
          mediaType: {
            format: "diff",
          },
        }
      );

      return data;
    } catch (error) {
      logger.error(
        `Failed to fetch PR diff for #${pullNumber}:`,
        error.message
      );
      throw error;
    }
  }

  async getPullRequestCommits(owner, repo, pullNumber) {
    try {
      logger.debug(
        `Fetching commits for PR #${pullNumber} in ${owner}/${repo}`
      );
      const octokit = await this.getOctokit();

      const { data } = await octokit.request(
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/commits",
        {
          owner,
          repo,
          pull_number: pullNumber,
        }
      );

      const commits = data.map((commit) => ({
        sha: commit.sha.substring(0, 7),
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
      }));

      logger.debug(`Fetched ${commits.length} commits for PR #${pullNumber}`);
      return commits;
    } catch (error) {
      logger.error(
        `Failed to fetch PR commits for #${pullNumber}:`,
        error.message
      );
      throw error;
    }
  }

  async updatePullRequest(owner, repo, pullNumber, updates) {
    try {
      logger.debug(`Updating PR #${pullNumber} in ${owner}/${repo}`);
      const octokit = await this.getOctokit();

      await octokit.request("PATCH /repos/{owner}/{repo}/pulls/{pull_number}", {
        owner,
        repo,
        pull_number: pullNumber,
        ...updates,
      });

      logger.info(`Successfully updated PR #${pullNumber}`);
    } catch (error) {
      logger.error(`Failed to update PR #${pullNumber}:`, error.message);
      throw error;
    }
  }

  async getPullRequest(owner, repo, pullNumber) {
    try {
      const octokit = await this.getOctokit();
      const { data } = await octokit.request(
        "GET /repos/{owner}/{repo}/pulls/{pull_number}",
        {
          owner,
          repo,
          pull_number: pullNumber,
        }
      );

      return data;
    } catch (error) {
      logger.error(`Failed to fetch PR #${pullNumber}:`, error.message);
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
