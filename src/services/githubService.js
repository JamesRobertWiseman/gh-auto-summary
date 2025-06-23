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
    try {
      logger.debug(
        `Getting installation token for installation: ${this.installationId}`
      );
      const octokit = await this.getOctokit();

      if (!octokit) {
        throw new Error("Failed to get octokit instance");
      }

      logger.debug(`Octokit auth type: ${typeof octokit.auth}`);

      if (typeof octokit.auth === "function") {
        const auth = await octokit.auth();
        logger.debug(`Auth result type: ${typeof auth}`);
        if (!auth || !auth.token) {
          throw new Error("Auth function returned invalid token");
        }
        return auth.token;
      } else if (octokit.auth && octokit.auth.token) {
        return octokit.auth.token;
      } else {
        throw new Error("No valid auth token found");
      }
    } catch (error) {
      logger.error(`Failed to get installation token:`, error.message);
      throw error;
    }
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

      // Add safety checks for commit data mapping
      logger.debug(`Raw commits data length: ${data?.length || 0}`);
      if (data && data.length > 0) {
        logger.debug(
          `First raw commit structure:`,
          JSON.stringify(data[0], null, 2)
        );
      }

      const commits = data
        .map((commit, index) => {
          try {
            // Safety checks for commit structure
            if (!commit) {
              logger.warn(`Commit at index ${index} is null/undefined`);
              return null;
            }

            if (!commit.sha) {
              logger.warn(`Commit at index ${index} missing sha:`, commit);
              return null;
            }

            if (!commit.commit) {
              logger.warn(
                `Commit at index ${index} missing commit object:`,
                commit
              );
              return null;
            }

            if (!commit.commit.message) {
              logger.warn(
                `Commit at index ${index} missing commit message:`,
                commit.commit
              );
              return null;
            }

            if (!commit.commit.author) {
              logger.warn(
                `Commit at index ${index} missing commit author:`,
                commit.commit
              );
              return null;
            }

            return {
              sha: commit.sha.substring(0, 7),
              message: commit.commit.message,
              author: commit.commit.author.name || "Unknown",
              date: commit.commit.author.date || new Date().toISOString(),
            };
          } catch (error) {
            logger.error(
              `Error processing commit at index ${index}:`,
              error.message
            );
            logger.error(`Problematic commit data:`, commit);
            return null;
          }
        })
        .filter((commit) => commit !== null); // Remove null entries

      logger.debug(
        `Fetched ${commits.length} valid commits for PR #${pullNumber}`
      );
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
