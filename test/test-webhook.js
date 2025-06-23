// Using built-in fetch (Node.js 18+)
import crypto from "crypto";

// Function to generate proper GitHub webhook signature
function generateWebhookSignature(payload, secret) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload, "utf8");
  return `sha256=${hmac.digest("hex")}`;
}

// Mock PR webhook payload
const mockPRPayload = {
  action: "opened",
  pull_request: {
    number: 123,
    title: "[GHAutoSummary] Add user authentication feature",
    body: "This PR adds user authentication functionality.\n\n[GHAutoSummary]\n\nImplements login/logout endpoints with JWT token handling.",
    changed_files: 5,
    additions: 120,
    deletions: 15,
  },
  repository: {
    name: "test-repo",
    owner: {
      login: "test-user",
    },
  },
  installation: {
    id: 12345, // Mock installation ID
  },
};

// Mock commits data
const mockCommits = [
  {
    sha: "abc1234",
    message:
      "feat(auth): add user login endpoint\n\nImplements JWT-based authentication",
    author: "Test User",
    date: "2024-01-15T10:30:00Z",
  },
  {
    sha: "def5678",
    message: "fix: resolve token validation issue",
    author: "Test User",
    date: "2024-01-15T11:00:00Z",
  },
  {
    sha: "ghi9012",
    message: "docs: update API documentation",
    author: "Test User",
    date: "2024-01-15T11:30:00Z",
  },
];

// Mock diff data
const mockDiff = `diff --git a/src/auth.js b/src/auth.js
new file mode 100644
index 0000000..123abc4
--- /dev/null
+++ b/src/auth.js
@@ -0,0 +1,25 @@
+import jwt from 'jsonwebtoken';
+
+export function generateToken(user) {
+  return jwt.sign(
+    { id: user.id, email: user.email },
+    process.env.JWT_SECRET,
+    { expiresIn: '24h' }
+  );
+}
+
+export function validateToken(token) {
+  try {
+    return jwt.verify(token, process.env.JWT_SECRET);
+  } catch (error) {
+    return null;
+  }
+}`;

async function checkServerHealth() {
  try {
    console.log("🔍 Checking if server is running...");
    const response = await fetch("http://localhost:3000/health");
    if (response.ok) {
      const health = await response.json();
      console.log("✅ Server is healthy:", health.status);
      return true;
    } else {
      console.log("❌ Server health check failed:", response.status);
      return false;
    }
  } catch (error) {
    console.log("❌ Server is not running on port 3000");
    console.log("💡 Start your server with: npm run dev");
    return false;
  }
}

async function testWebhook() {
  try {
    console.log("🧪 Testing webhook locally...");

    // First check if server is running
    const serverRunning = await checkServerHealth();
    if (!serverRunning) {
      console.log("\n📋 To run this test:");
      console.log("1. Start your server: npm run dev");
      console.log("2. In another terminal: npm run test:webhook");
      return;
    }

    console.log("📤 Sending webhook payload...");

    // Convert payload to string for signature generation
    const payloadString = JSON.stringify(mockPRPayload);

    // Use test signature or generate proper one if secret is available
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    let signature;

    if (webhookSecret) {
      signature = generateWebhookSignature(payloadString, webhookSecret);
      console.log("🔐 Using proper HMAC signature");
    } else {
      signature = "sha256=test-signature";
      console.log("🧪 Using test signature (development mode)");
    }

    const response = await fetch("http://localhost:3000/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-GitHub-Event": "pull_request",
        "X-Hub-Signature-256": signature,
      },
      body: payloadString,
    });

    console.log("📋 Response status:", response.status);
    console.log(
      "📋 Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    // Handle different content types
    const contentType = response.headers.get("content-type");
    let result;

    if (contentType && contentType.includes("application/json")) {
      result = await response.json();
      console.log(
        "✅ Webhook response (JSON):",
        JSON.stringify(result, null, 2)
      );
    } else {
      const text = await response.text();
      console.log(
        "📄 Webhook response (Text):",
        text.substring(0, 500) + "..."
      );

      if (text.includes("<!DOCTYPE")) {
        console.log(
          "❌ Server returned HTML page - check your endpoint configuration"
        );
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Make sure your server is running: npm run dev");
    console.log("2. Check that port 3000 is available");
    console.log("3. Verify your webhook endpoint is working");
    console.log(
      "4. Set GITHUB_WEBHOOK_SECRET if you want to test signature verification"
    );
  }
}

// Run the test
testWebhook();
