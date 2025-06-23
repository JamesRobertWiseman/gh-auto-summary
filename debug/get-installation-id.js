import { config, validateConfig } from "../src/config/index.js";
import { githubAppService } from "../src/services/githubAppService.js";
import { createLogger } from "../src/utils/logger.js";

const logger = createLogger("InstallationIDFinder");

async function findInstallationIDs() {
  try {
    console.log("🔍 Finding Installation IDs for your GitHub App");
    console.log("=".repeat(50));

    // Validate configuration
    validateConfig();
    console.log("✅ Configuration validated");

    // Get all installations for this app
    console.log("\n📋 Fetching all installations...");

    const installations = await githubAppService.app.octokit.request(
      "GET /app/installations"
    );

    if (installations.data.length === 0) {
      console.log("❌ No installations found!");
      console.log("\n💡 To get an installation ID:");
      console.log(
        "1. Go to: https://github.com/settings/apps/" + config.github.appSlug
      );
      console.log("2. Click 'Install App' in the left sidebar");
      console.log("3. Install on your account/org");
      console.log("4. Note the installation ID from the URL");
      return;
    }

    console.log(`✅ Found ${installations.data.length} installation(s):`);
    console.log();

    for (const installation of installations.data) {
      console.log(`📱 Installation ID: ${installation.id}`);
      console.log(
        `   Account: ${installation.account.login} (${installation.account.type})`
      );
      console.log(
        `   Created: ${new Date(installation.created_at).toLocaleDateString()}`
      );
      console.log(
        `   Updated: ${new Date(installation.updated_at).toLocaleDateString()}`
      );
      console.log(
        `   Repositories: ${installation.repository_selection || "all"}`
      );

      // Get accessible repositories for this installation
      try {
        const repos = await githubAppService.app.octokit.request(
          "GET /installation/repositories",
          {
            headers: {
              authorization: `token ${await getInstallationToken(
                installation.id
              )}`,
            },
          }
        );

        console.log(`   Accessible repos: ${repos.data.total_count}`);
        if (repos.data.repositories.length > 0) {
          console.log(`   Sample repos:`);
          repos.data.repositories.slice(0, 3).forEach((repo) => {
            console.log(`     - ${repo.full_name}`);
          });
        }
      } catch (error) {
        console.log(`   Error fetching repos: ${error.message}`);
      }

      console.log();
    }

    // Show how to use in environment
    console.log("🛠️  Environment Variable Setup:");
    console.log("=".repeat(30));

    const primaryInstallation = installations.data[0];
    console.log(`# Add this to your .env file:`);
    console.log(`TEST_INSTALLATION_ID=${primaryInstallation.id}`);
    console.log(`TEST_OWNER=${primaryInstallation.account.login}`);
    console.log(`# TEST_REPO=your-repo-name`);
    console.log(`# TEST_PR_NUMBER=1`);

    console.log("\n🧪 Test Command:");
    console.log(
      `TEST_INSTALLATION_ID=${primaryInstallation.id} npm run test:hybrid`
    );
  } catch (error) {
    console.error("❌ Failed to find installation IDs:", error.message);

    if (error.status === 401) {
      console.log("\n💡 This usually means:");
      console.log("1. GITHUB_APP_ID is incorrect");
      console.log("2. GITHUB_PRIVATE_KEY is invalid");
      console.log("3. The app hasn't been created yet");
    }
  }
}

async function getInstallationToken(installationId) {
  const response = await githubAppService.app.octokit.request(
    "POST /app/installations/{installation_id}/access_tokens",
    {
      installation_id: installationId,
    }
  );
  return response.data.token;
}

// Export for use in other scripts
export { findInstallationIDs };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  findInstallationIDs()
    .then(() => {
      console.log("\n✅ Installation ID search completed");
    })
    .catch((error) => {
      console.error("\n💥 Search failed:", error.message);
      process.exit(1);
    });
}
