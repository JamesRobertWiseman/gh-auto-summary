import { PR_CONSTANTS } from "../utils/constants.js";
import { createLogger } from "../utils/logger.js";
import { llmService } from "./llmService.js";

const logger = createLogger("PRService");

export class PRService {
  constructor() {
    this.AUTO_SUMMARY_TAG = PR_CONSTANTS.AUTO_SUMMARY_TAG;
    this.SUMMARY_MARKER = PR_CONSTANTS.SUMMARY_MARKER;
    this.END_MARKER = PR_CONSTANTS.END_MARKER;
  }

  shouldProcessPR(pullRequest) {
    const title = pullRequest.title || "";
    const body = pullRequest.body || "";

    const hasTag =
      title.includes(this.AUTO_SUMMARY_TAG) ||
      body.includes(this.AUTO_SUMMARY_TAG);

    if (hasTag) {
      logger.info(
        `PR #${pullRequest.number} contains ${this.AUTO_SUMMARY_TAG} tag - will process`
      );
    } else {
      logger.debug(
        `PR #${pullRequest.number} does not contain ${this.AUTO_SUMMARY_TAG} tag - skipping`
      );
    }

    return hasTag;
  }

  async processPullRequest(owner, repo, pullRequest, githubService) {
    try {
      logger.info(`Processing PR #${pullRequest.number} in ${owner}/${repo}`);

      const [diff, commits] = await Promise.all([
        githubService.getPullRequestDiff(owner, repo, pullRequest.number),
        githubService.getPullRequestCommits(owner, repo, pullRequest.number),
      ]);

      logger.debug(
        `Retrieved ${commits?.length || 0} commits for PR #${
          pullRequest.number
        }`
      );

      // Add detailed logging for debugging
      logger.debug(`Commits data type: ${typeof commits}`);
      logger.debug(`Commits is array: ${Array.isArray(commits)}`);
      if (Array.isArray(commits) && commits.length > 0) {
        logger.debug(
          `First commit structure:`,
          JSON.stringify(commits[0], null, 2)
        );
      }

      logger.debug("Getting installation token...");
      const token = await githubService.getInstallationToken();
      logger.debug("Token obtained, generating summary...");

      const generatedContent = await llmService.generatePRSummary(
        pullRequest,
        diff,
        commits,
        token
      );

      logger.debug("Summary generated successfully");

      await this.updatePRWithSummary(
        owner,
        repo,
        pullRequest.number,
        pullRequest.body || "",
        generatedContent,
        githubService
      );

      logger.info(`Successfully processed PR #${pullRequest.number}`);
      return {
        success: true,
        message: "PR summary generated successfully",
        commits: Array.isArray(commits) ? commits.length : 0,
        hasConventionalCommits: this._hasConventionalCommits(commits || []),
      };
    } catch (error) {
      logger.error(
        `Failed to process PR #${pullRequest.number}:`,
        error.message
      );
      throw error;
    }
  }

  async updatePRWithSummary(
    owner,
    repo,
    prNumber,
    currentBody,
    generatedContent,
    githubService
  ) {
    try {
      const newBody = this._insertOrUpdateSummary(
        currentBody,
        generatedContent
      );

      await githubService.updatePullRequest(owner, repo, prNumber, {
        body: newBody,
      });

      logger.info(`Updated PR #${prNumber} with AI-generated summary`);
    } catch (error) {
      logger.error(
        `Failed to update PR #${prNumber} with summary:`,
        error.message
      );
      throw error;
    }
  }

  _insertOrUpdateSummary(currentBody, generatedContent) {
    if (currentBody.includes(this.SUMMARY_MARKER)) {
      const beforeSummary = currentBody.split(this.SUMMARY_MARKER)[0];
      const afterSummary = currentBody.split(this.END_MARKER)[1] || "";
      return `${beforeSummary}${this.SUMMARY_MARKER}\n${generatedContent}\n${this.END_MARKER}${afterSummary}`;
    } else {
      return `${this.SUMMARY_MARKER}\n${generatedContent}\n${this.END_MARKER}\n\n${currentBody}`;
    }
  }

  _hasConventionalCommits(commits) {
    if (!Array.isArray(commits)) {
      logger.warn(
        "_hasConventionalCommits: commits is not an array",
        typeof commits
      );
      return false;
    }

    const conventionalCommitRegex =
      /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?\!?:\s(.+)/;

    return commits.some((commit) => {
      if (!commit || !commit.message || typeof commit.message !== "string") {
        logger.warn("Invalid commit in _hasConventionalCommits:", commit);
        return false;
      }
      return conventionalCommitRegex.test(commit.message.split("\n")[0]);
    });
  }

  isValidPRAction(action) {
    return PR_CONSTANTS.VALID_ACTIONS.includes(action);
  }
}

export const prService = new PRService();
