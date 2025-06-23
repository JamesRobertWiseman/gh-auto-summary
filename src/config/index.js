import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3000),
  github: {
    token: process.env.GITHUB_TOKEN,
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
  },
  api: {
    copilotBaseUrl: "https://api.githubcopilot.com",
  },
  app: {
    name: "GitHub Auto Summary Extension",
    version: "1.0.0",
  },
};

export function validateConfig() {
  const required = [{ key: "GITHUB_TOKEN", value: config.github.token }];

  const missing = required.filter(({ value }) => !value);

  if (missing.length > 0) {
    const missingKeys = missing.map(({ key }) => key).join(", ");
    throw new Error(`Missing required environment variables: ${missingKeys}`);
  }
}
