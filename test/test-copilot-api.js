import { createAppAuth } from "@octokit/auth-app";
import { config, validateConfig } from "../src/config/index.js";
import { createLogger } from "../src/utils/logger.js";

const logger = createLogger("CopilotTest");

async function testCopilotAPI() {
  try {
    validateConfig();

    // Create app auth
    const auth = createAppAuth({
      appId: config.github.appId,
      privateKey: config.github.privateKey,
    });

    // Get JWT token
    const appAuth = await auth({ type: "app" });
    console.log("✅ Got app JWT token");

    // Test with different prompt sizes
    const testCases = [
      {
        name: "Small prompt",
        content: "Hello, can you help me write a simple commit message?",
      },
      {
        name: "Medium prompt",
        content:
          "Please analyze this pull request and generate a summary. " +
          "a".repeat(1000),
      },
      {
        name: "Large prompt",
        content:
          "Please analyze this pull request and generate a summary. " +
          "a".repeat(10000),
      },
    ];

    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      console.log(`Prompt length: ${testCase.content.length} characters`);

      const requestBody = {
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant.",
          },
          {
            role: "user",
            content: testCase.content,
          },
        ],
        stream: false,
      };

      console.log(
        `Request body size: ${JSON.stringify(requestBody).length} characters`
      );

      try {
        const response = await fetch(
          "https://api.githubcopilot.com/chat/completions",
          {
            method: "POST",
            headers: {
              authorization: `Bearer ${appAuth.token}`,
              "content-type": "application/json",
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log(
            `✅ Success: Got response with ${
              data.choices?.[0]?.message?.content?.length || 0
            } characters`
          );
        } else {
          const errorBody = await response.text();
          console.log(`❌ Failed: ${response.status} ${response.statusText}`);
          console.log(`Error body: ${errorBody}`);
        }
      } catch (error) {
        console.log(`❌ Request failed: ${error.message}`);
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testCopilotAPI();
