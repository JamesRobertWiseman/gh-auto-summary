import { Octokit } from "@octokit/core";
import { config } from "../config/index.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("GitHubService");

export class GitHubService {
  constructor(token = config.github.token) {
    this.octokit = new Octokit({ auth: token });
  }

  async getUser() {
    try {
      const response = await this.octokit.request("GET /user");
      return response.data;
    } catch (error) {
      logger.error("Failed to get user information:", error.message);
      throw error;
    }
  }

  async getPullRequestDiff(owner, repo, pullNumber) {
    try {
      logger.debug(`Fetching diff for PR #${pullNumber} in ${owner}/${repo}`);

      const { data } = await this.octokit.request(
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

      const { data } = await this.octokit.request(
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

      await this.octokit.request(
        "PATCH /repos/{owner}/{repo}/pulls/{pull_number}",
        {
          owner,
          repo,
          pull_number: pullNumber,
          ...updates,
        }
      );

      logger.info(`Successfully updated PR #${pullNumber}`);
    } catch (error) {
      logger.error(`Failed to update PR #${pullNumber}:`, error.message);
      throw error;
    }
  }

  async getPullRequest(owner, repo, pullNumber) {
    try {
      const { data } = await this.octokit.request(
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
}

export const githubService = new GitHubService();
