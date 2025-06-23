import { config, validateConfig } from "../src/config/index.js";
import { copilotClientService } from "../src/services/copilotClientService.js";
import { GitHubService } from "../src/services/githubService.js";
import { prService } from "../src/services/prService.js";
import { createLogger } from "../src/utils/logger.js";

const logger = createLogger("HybridCopilotTest");

async function testHybridApproach() {
  try {
    console.log("🧪 Testing Hybrid Webhook + Copilot API Approach");
    console.log("=".repeat(50));

    // Validate configuration
    try {
      validateConfig();
      console.log("✅ Configuration validated");
    } catch (error) {
      console.error("❌ Configuration validation failed:", error.message);
      return;
    }

    // Test data (replace with your actual data)
    const testData = {
      installationId: parseInt(process.env.TEST_INSTALLATION_ID || "12345", 10),
      owner: process.env.TEST_OWNER || "test-owner",
      repo: process.env.TEST_REPO || "test-repo",
      prNumber: parseInt(process.env.TEST_PR_NUMBER || "1", 10),
    };

    console.log("\n📋 Test Configuration:");
    console.log(`   Installation ID: ${testData.installationId}`);
    console.log(`   Repository: ${testData.owner}/${testData.repo}`);
    console.log(`   PR Number: #${testData.prNumber}`);
    console.log(`   AI Provider: ${config.ai.provider}`);

    // Test 1: GitHub App Authentication
    console.log("\n🔑 Testing GitHub App Authentication...");
    try {
      const githubService = new GitHubService(testData.installationId);
      const token = await githubService.getInstallationToken();
      console.log("✅ Installation token obtained successfully");

      // Test token length (should be a real token)
      if (token && token.length > 20) {
        console.log(`✅ Token appears valid (${token.length} characters)`);
      } else {
        console.log("⚠️  Token may be invalid or too short");
      }
    } catch (error) {
      console.error("❌ GitHub App authentication failed:", error.message);
      return;
    }

    // Test 2: Copilot API Access Test
    console.log("\n🤖 Testing Copilot API Access...");
    try {
      const githubService = new GitHubService(testData.installationId);
      const token = await githubService.getInstallationToken();

      const hasAccess = await copilotClientService.checkCopilotAPIAccess(token);

      if (hasAccess) {
        console.log(
          "✅ Copilot API access confirmed - installation tokens work!"
        );
      } else {
        console.log(
          "⚠️  Copilot API access failed - installation tokens not supported"
        );
        console.log(
          "💡 This is expected - will fall back to other AI providers"
        );
      }
    } catch (error) {
      console.error("❌ Copilot API access test failed:", error.message);
    }

    // Test 3: Full Hybrid Integration
    console.log("\n🔄 Testing Full Hybrid Integration...");
    try {
      const testResult = await prService.testCopilotIntegration(
        testData.installationId,
        testData.owner,
        testData.repo,
        testData.prNumber
      );

      if (testResult.success) {
        console.log("✅ Hybrid integration test successful!");
        console.log(`   Method used: ${testResult.method}`);
        if (testResult.summary) {
          console.log("✅ Summary generated successfully");
          console.log("📝 Sample summary preview:");
          console.log(testResult.summary.substring(0, 200) + "...");
        }
      } else {
        console.log("⚠️  Hybrid integration fell back to alternative provider");
        console.log(`   Reason: ${testResult.reason}`);
        console.log(`   Recommendation: ${testResult.recommendation}`);
      }
    } catch (error) {
      console.error("❌ Hybrid integration test failed:", error.message);
    }

    // Test 4: Webhook Payload Simulation
    console.log("\n📨 Testing Webhook Payload Processing...");
    try {
      const mockPayload = createMockWebhookPayload(testData);

      console.log("📋 Mock payload created with [GHAutoSummary] tag");

      // This would normally be called by the webhook handler
      const result = await prService.processPullRequest(mockPayload);

      if (result.processed) {
        console.log("✅ Webhook payload processed successfully!");
        console.log(`   Method used: ${result.method}`);
        console.log(`   Commits: ${result.commits}`);
        console.log(`   Files changed: ${result.files_changed}`);
      } else {
        console.log("⚠️  Webhook payload not processed");
        console.log(`   Reason: ${result.reason}`);
      }
    } catch (error) {
      console.error("❌ Webhook payload processing failed:", error.message);
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("🎯 Test Summary");
    console.log("=".repeat(50));

    if (config.ai.provider === "copilot") {
      console.log("🤖 Copilot API is primary provider");
      console.log("📝 Expected behavior:");
      console.log("   1. Try Copilot API with installation token");
      console.log(
        "   2. If fails, fall back to OpenAI/Anthropic (if configured)"
      );
      console.log("   3. If all fail, use smart fallback summary");
    } else {
      console.log(`🔧 ${config.ai.provider.toUpperCase()} is primary provider`);
      console.log("📝 Expected behavior:");
      console.log(`   1. Use ${config.ai.provider.toUpperCase()} API directly`);
      console.log("   2. If fails, use smart fallback summary");
    }

    console.log("\n💡 Recommendations:");
    if (
      config.ai.provider === "copilot" &&
      !config.ai.openai.apiKey &&
      !config.ai.anthropic.apiKey
    ) {
      console.log(
        "   - Consider setting OPENAI_API_KEY or ANTHROPIC_API_KEY as fallback"
      );
      console.log("   - Installation tokens may not work with Copilot API");
    }

    console.log("   - Test with a real PR that has the [GHAutoSummary] tag");
    console.log("   - Check webhook delivery in GitHub App settings");
  } catch (error) {
    console.error("❌ Test suite failed:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

function createMockWebhookPayload(testData) {
  return {
    action: "opened",
    pull_request: {
      number: testData.prNumber,
      title: "[GHAutoSummary] Test PR for hybrid approach",
      body: "This is a test PR to validate the hybrid webhook + Copilot API approach.",
      changed_files: 3,
      additions: 25,
      deletions: 5,
    },
    repository: {
      name: testData.repo,
      owner: {
        login: testData.owner,
      },
      full_name: `${testData.owner}/${testData.repo}`,
    },
    installation: {
      id: testData.installationId,
    },
  };
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testHybridApproach()
    .then(() => {
      console.log("\n🏁 Test completed");
    })
    .catch((error) => {
      console.error("\n💥 Test failed:", error.message);
      process.exit(1);
    });
}
