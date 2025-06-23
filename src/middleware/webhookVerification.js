import crypto from "node:crypto";
import { config } from "../config/index.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("WebhookVerification");

export function verifyGitHubWebhook(req, res, next) {
  const signature = req.get("X-Hub-Signature-256");
  const payload = JSON.stringify(req.body);
  const secret = config.github.webhookSecret;

  if (!secret) {
    logger.warn(
      "GITHUB_WEBHOOK_SECRET not set - skipping webhook verification"
    );
    return next();
  }

  if (!signature) {
    logger.error("No signature provided in webhook request");
    return res.status(401).json({ error: "No signature provided" });
  }

  const expectedSignature = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex")}`;

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  ) {
    logger.error("Invalid webhook signature");
    return res.status(401).json({ error: "Invalid signature" });
  }

  logger.debug("Webhook signature verified successfully");
  next();
}
