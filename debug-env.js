// Simple environment variable checker
console.log("🔍 Environment Variable Check:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("GITHUB_APP_ID:", process.env.GITHUB_APP_ID ? "SET" : "NOT SET");
console.log("GITHUB_APP_ID value:", process.env.GITHUB_APP_ID);
console.log("GITHUB_APP_ID parsed:", parseInt(process.env.GITHUB_APP_ID, 10));
console.log("GITHUB_APP_ID type:", typeof process.env.GITHUB_APP_ID);
console.log(
  "GITHUB_PRIVATE_KEY:",
  process.env.GITHUB_PRIVATE_KEY
    ? `SET (${process.env.GITHUB_PRIVATE_KEY.length} chars)`
    : "NOT SET"
);
console.log(
  "GITHUB_WEBHOOK_SECRET:",
  process.env.GITHUB_WEBHOOK_SECRET ? "SET" : "NOT SET"
);
console.log(
  "GITHUB_CLIENT_ID:",
  process.env.GITHUB_CLIENT_ID ? "SET" : "NOT SET"
);
console.log(
  "GITHUB_CLIENT_SECRET:",
  process.env.GITHUB_CLIENT_SECRET ? "SET" : "NOT SET"
);

if (process.env.GITHUB_PRIVATE_KEY) {
  console.log(
    "Private key starts with:",
    process.env.GITHUB_PRIVATE_KEY.substring(0, 50) + "..."
  );
  console.log(
    "Private key includes BEGIN:",
    process.env.GITHUB_PRIVATE_KEY.includes("-----BEGIN")
  );
  console.log(
    "Private key includes END:",
    process.env.GITHUB_PRIVATE_KEY.includes("-----END")
  );
}

// Test creating a simple GitHub App instance
try {
  console.log("\n🧪 Testing GitHub App Creation:");
  const { App } = await import("@octokit/app");

  const appId = parseInt(process.env.GITHUB_APP_ID, 10);
  console.log("🔢 Parsed App ID:", appId);
  console.log("🔢 App ID type:", typeof appId);
  console.log("🔢 App ID is valid number:", !isNaN(appId));

  const app = new App({
    appId: appId,
    privateKey: process.env.GITHUB_PRIVATE_KEY,
    webhooks: {
      secret: process.env.GITHUB_WEBHOOK_SECRET,
    },
  });

  console.log("✅ GitHub App instance created successfully");
  console.log("App ID from instance:", app.appId);
  console.log("App ID type from instance:", typeof app.appId);
} catch (error) {
  console.error("❌ Failed to create GitHub App instance:", error.message);
  console.error("Error stack:", error.stack);
}
