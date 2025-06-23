// Mock GitHub service for local testing
export class MockGitHubService {
  constructor(installationId) {
    this.installationId = installationId;
    console.log(
      `📝 Mock GitHub Service created for installation: ${installationId}`
    );
  }

  async getPullRequestDiff(owner, repo, pullNumber) {
    console.log(
      `📄 Mock: Getting diff for PR #${pullNumber} in ${owner}/${repo}`
    );

    // Return mock diff data
    return `diff --git a/src/auth.js b/src/auth.js
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
  }

  async getPullRequestCommits(owner, repo, pullNumber) {
    console.log(
      `📋 Mock: Getting commits for PR #${pullNumber} in ${owner}/${repo}`
    );

    // Return mock commits
    return [
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
  }

  async updatePullRequest(owner, repo, pullNumber, updates) {
    console.log(`✏️  Mock: Updating PR #${pullNumber} in ${owner}/${repo}`);
    console.log(
      "📝 New body preview:",
      updates.body?.substring(0, 200) + "..."
    );

    // Simulate successful update
    return { status: "success" };
  }

  async getInstallationToken() {
    console.log("🔑 Mock: Getting installation token");

    // Return a mock token (you can use your real GitHub token for testing)
    return process.env.GITHUB_PERSONAL_TOKEN || "mock-token-for-testing";
  }
}
