import express from "express";
import { config } from "../config/index.js";
import { githubAppService } from "../services/githubAppService.js";
import { createLogger } from "../utils/logger.js";

const router = express.Router();
const logger = createLogger("AuthRoutes");

// Handle OAuth callback from GitHub
router.get("/callback", async (req, res) => {
  const { code, state, installation_id } = req.query;

  if (!code) {
    logger.error("No authorization code provided in callback");
    return res.status(400).json({ error: "Missing authorization code" });
  }

  try {
    logger.info("Handling OAuth callback", { installation_id, state });

    // For GitHub Apps, the installation flow is typically handled differently
    // This callback is mainly for user authorization flows

    // You could exchange the code for an access token here if needed
    // const response = await fetch('https://github.com/login/oauth/access_token', {
    //   method: 'POST',
    //   headers: {
    //     'Accept': 'application/json',
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     client_id: config.github.clientId,
    //     client_secret: config.github.clientSecret,
    //     code: code,
    //   }),
    // });

    // For now, redirect to a success page or back to GitHub
    res.redirect(
      `https://github.com/apps/${config.github.appSlug}/installations/new`
    );
  } catch (error) {
    logger.error("OAuth callback error:", error.message);
    res.status(500).json({
      error: "OAuth callback failed",
      details: error.message,
    });
  }
});

// Installation success callback
router.get("/installation/callback", async (req, res) => {
  const { installation_id, setup_action } = req.query;

  try {
    logger.info("Installation callback received", {
      installation_id,
      setup_action,
    });

    if (setup_action === "install") {
      // App was successfully installed
      const installation = await githubAppService.getInstallation(
        installation_id
      );
      logger.info(
        `App successfully installed for: ${installation.account.login}`
      );

      res.json({
        success: true,
        message: "GitHub PR Auto Summary App installed successfully!",
        installation: {
          id: installation_id,
          account: installation.account.login,
          type: installation.account.type,
        },
        next_steps: [
          "Create a pull request in any of your repositories",
          "Add [GHAutoSummary] to the PR title or description",
          "Watch as the app automatically generates summaries and changelogs!",
        ],
      });
    } else {
      res.json({
        success: true,
        message: "Installation setup completed",
        installation_id,
      });
    }
  } catch (error) {
    logger.error("Installation callback error:", error.message);
    res.status(500).json({
      error: "Installation callback failed",
      details: error.message,
    });
  }
});

export default router;
