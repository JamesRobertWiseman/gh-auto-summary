import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3000),
  github: {
    appId: parseInt(process.env.GITHUB_APP_ID, 10),
    privateKey: process.env.GITHUB_PRIVATE_KEY,
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    appSlug: process.env.GITHUB_APP_SLUG || "github-pr-auto-summary",
  },
  api: {
    copilotBaseUrl: "https://api.githubcopilot.com",
  },
  app: {
    name: "GitHub Auto Summary Extension",
    version: "1.0.0",
  },
  // Test mode configuration
  test: {
    mockMode:
      process.env.NODE_ENV === "development" &&
      process.env.MOCK_GITHUB_API === "true",
    skipGitHubAPI: process.env.SKIP_GITHUB_API === "true",
  },
};

export function validateConfig() {
  // Skip validation in test mode
  if (config.test.mockMode || config.test.skipGitHubAPI) {
    console.log("⚠️  Running in test mode - skipping GitHub App validation");
    return;
  }

  const required = [
    { key: "GITHUB_APP_ID", value: config.github.appId },
    { key: "GITHUB_PRIVATE_KEY", value: config.github.privateKey },
    { key: "GITHUB_WEBHOOK_SECRET", value: config.github.webhookSecret },
  ];

  const missing = required.filter(({ value }) => !value);

  if (missing.length > 0) {
    const missingKeys = missing.map(({ key }) => key).join(", ");
    throw new Error(`Missing required environment variables: ${missingKeys}`);
  }
}
