import express from "express";
import { verifyGitHubWebhook } from "../middleware/webhookVerification.js";
import { prService } from "../services/prService.js";
import { createLogger } from "../utils/logger.js";

const router = express.Router();
const logger = createLogger("WebhookRoutes");

router.post(
  "/",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    req.body = JSON.parse(req.body.toString());
    next();
  },
  verifyGitHubWebhook,
  async (req, res) => {
    try {
      const event = req.get("X-GitHub-Event");
      const payload = req.body;

      logger.info(`Received ${event} event`);

      // Handle different event types
      if (event === "installation") {
        await handleInstallationEvent(payload);
        return res
          .status(200)
          .json({ message: "Installation event processed" });
      }

      if (event === "installation_repositories") {
        await handleInstallationRepositoriesEvent(payload);
        return res
          .status(200)
          .json({ message: "Installation repositories event processed" });
      }

      if (event === "pull_request") {
        await handlePullRequestEvent(payload, res);
        return;
      }

      logger.debug(`Ignoring ${event} event`);
      res.status(200).json({ message: `Ignored ${event} event` });
    } catch (error) {
      logger.error("Error processing webhook:", error.message);
      res.status(500).json({
        error: "Failed to process webhook",
        details: error.message,
      });
    }
  }
);

async function handleInstallationEvent(payload) {
  const { action, installation } = payload;

  if (action === "created") {
    logger.info(`App installed on account: ${installation.account.login}`);
  } else if (action === "deleted") {
    logger.info(`App uninstalled from account: ${installation.account.login}`);
  }
}

async function handleInstallationRepositoriesEvent(payload) {
  const { action, installation, repositories_added, repositories_removed } =
    payload;

  if (action === "added") {
    logger.info(
      `App installed on ${repositories_added.length} new repositories`
    );
  } else if (action === "removed") {
    logger.info(`App removed from ${repositories_removed.length} repositories`);
  }
}

async function handlePullRequestEvent(payload, res) {
  const { action, pull_request, repository, installation } = payload;

  logger.info(
    `Processing pull_request ${action} event for PR #${pull_request.number}`
  );

  if (!prService.isValidPRAction(action)) {
    logger.debug(`Ignoring ${action} action for PR #${pull_request.number}`);
    return res.status(200).json({ message: `Ignored ${action} action` });
  }

  if (!prService.shouldProcessPR(pull_request)) {
    return res.status(200).json({
      message: "PR does not contain GHAutoSummary tag",
    });
  }

  try {
    const owner = repository.owner.login;
    const repo = repository.name;

    const githubService = new GitHubService(installation.id);

    const result = await prService.processPullRequest(
      owner,
      repo,
      pull_request,
      githubService
    );

    res.status(200).json(result);
  } catch (error) {
    logger.error(
      `Failed to process PR #${pull_request.number}:`,
      error.message
    );
    res.status(500).json({
      error: "Failed to process PR",
      details: error.message,
    });
  }
}

export default router;
