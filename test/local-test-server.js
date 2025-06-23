import express from "express";
import { MockGitHubService } from "../src/services/mockGitHubService.js";
import { prService } from "../src/services/prService.js";
import { createLogger } from "../src/utils/logger.js";

const app = express();
const logger = createLogger("LocalTestServer");

app.use(express.json());

// Test endpoint that bypasses webhooks
app.post("/test-pr-summary", async (req, res) => {
  try {
    console.log("🧪 Testing PR summary generation locally...");

    const mockPR = {
      number: 123,
      title: "[GHAutoSummary] Add user authentication feature",
      body: "This PR adds user authentication functionality.\n\n[GHAutoSummary]\n\nImplements login/logout endpoints with JWT token handling.",
    };

    const mockGitHubService = new MockGitHubService(12345);

    // Test the PR processing
    const result = await prService.processPullRequest(
      "test-user",
      "test-repo",
      mockPR,
      mockGitHubService
    );

    console.log("✅ Test completed successfully!");
    res.json({
      success: true,
      message: "Local test completed",
      result,
    });
  } catch (error) {
    console.error("❌ Test failed:", error);
    res.status(500).json({
      error: "Test failed",
      details: error.message,
    });
  }
});

// Test LLM service directly
app.post("/test-llm", async (req, res) => {
  try {
    console.log("🤖 Testing LLM service directly...");

    const { llmService } = await import("../src/services/llmService.js");

    const mockPR = {
      title: "[GHAutoSummary] Add user authentication feature",
      body: "This PR adds user authentication functionality.",
      changed_files: 5,
      additions: 120,
      deletions: 15,
    };

    const mockDiff = `diff --git a/src/auth.js b/src/auth.js
new file mode 100644
index 0000000..123abc4
--- /dev/null
+++ b/src/auth.js
+export function generateToken(user) {
+  return jwt.sign({ id: user.id }, process.env.JWT_SECRET);
+}`;

    const mockCommits = [
      {
        sha: "abc1234",
        message: "feat(auth): add user login endpoint",
        author: "Test User",
      },
    ];

    // You'll need a real token for this test
    const token = process.env.GITHUB_PERSONAL_TOKEN;

    if (!token) {
      return res.status(400).json({
        error:
          "GITHUB_PERSONAL_TOKEN environment variable required for LLM testing",
      });
    }

    const summary = await llmService.generatePRSummary(
      mockPR,
      mockDiff,
      mockCommits,
      token
    );

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("❌ LLM test failed:", error);
    res.status(500).json({
      error: "LLM test failed",
      details: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.json({
    message: "Local Test Server Running 🧪",
    endpoints: {
      "/test-pr-summary": "POST - Test full PR processing with mocks",
      "/test-llm":
        "POST - Test LLM service directly (requires GITHUB_PERSONAL_TOKEN)",
    },
  });
});

const port = 3001;
app.listen(port, () => {
  console.log(`🧪 Local test server running on http://localhost:${port}`);
  console.log("📝 Test endpoints:");
  console.log("  POST /test-pr-summary - Test full PR processing");
  console.log("  POST /test-llm - Test LLM service directly");
});
