import { PR_CONSTANTS } from "../utils/constants.js";
import { createLogger } from "../utils/logger.js";
import { githubService } from "./githubService.js";
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

  async processPullRequest(owner, repo, pullRequest) {
    try {
      logger.info(`Processing PR #${pullRequest.number} in ${owner}/${repo}`);

      const [diff, commits] = await Promise.all([
        githubService.getPullRequestDiff(owner, repo, pullRequest.number),
        githubService.getPullRequestCommits(owner, repo, pullRequest.number),
      ]);

      logger.debug(
        `Retrieved ${commits.length} commits for PR #${pullRequest.number}`
      );

      const generatedContent = await llmService.generatePRSummary(
        pullRequest,
        diff,
        commits
      );

      await this.updatePRWithSummary(
        owner,
        repo,
        pullRequest.number,
        pullRequest.body || "",
        generatedContent
      );

      logger.info(`Successfully processed PR #${pullRequest.number}`);
      return {
        success: true,
        message: "PR summary generated successfully",
        commits: commits.length,
        hasConventionalCommits: this._hasConventionalCommits(commits),
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
    generatedContent
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
    const conventionalCommitRegex =
      /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?\!?:\s(.+)/;
    return commits.some((commit) =>
      conventionalCommitRegex.test(commit.message.split("\n")[0])
    );
  }

  isValidPRAction(action) {
    return PR_CONSTANTS.VALID_ACTIONS.includes(action);
  }
}

export const prService = new PRService();
