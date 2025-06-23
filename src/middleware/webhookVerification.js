import crypto from "node:crypto";
import { config } from "../config/index.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("WebhookVerification");

export function verifyGitHubWebhook(req, res, next) {
  const signature = req.get("X-Hub-Signature-256");
  const payload = JSON.stringify(req.body);
  const secret = config.github.webhookSecret;

  // Skip verification in development/test mode if no secret is set
  if (!secret) {
    logger.warn(
      "GITHUB_WEBHOOK_SECRET not set - skipping webhook verification"
    );
    return next();
  }

  // Skip verification for test signatures in development
  if (
    process.env.NODE_ENV === "development" &&
    signature === "sha256=test-signature"
  ) {
    logger.warn(
      "Using test signature in development mode - skipping verification"
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

  // Check if lengths are equal before using timingSafeEqual
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    logger.error("Invalid webhook signature - length mismatch");
    return res.status(401).json({ error: "Invalid signature" });
  }

  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    logger.error("Invalid webhook signature");
    return res.status(401).json({ error: "Invalid signature" });
  }

  logger.debug("Webhook signature verified successfully");
  next();
}
