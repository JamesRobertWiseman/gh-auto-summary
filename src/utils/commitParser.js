import {
  CONVENTIONAL_COMMIT_REGEX,
  CONVENTIONAL_COMMIT_TYPES,
} from "./constants.js";

export class CommitParser {
  static parseConventionalCommits(commits) {
    const conventionalCommits = [];
    const regularCommits = [];

    commits.forEach((commit) => {
      const message = commit.message.split("\n")[0];
      const match = message.match(CONVENTIONAL_COMMIT_REGEX);

      if (match) {
        const [, type, scope, description] = match;
        conventionalCommits.push({
          type: type,
          scope: scope ? scope.slice(1, -1) : null,
          description: description,
          originalMessage: message,
          sha: commit.sha,
          author: commit.author,
        });
      } else {
        regularCommits.push({
          message: message,
          sha: commit.sha,
          author: commit.author,
        });
      }
    });

    return { conventionalCommits, regularCommits };
  }

  static formatChangelogFromCommits(commits) {
    const { conventionalCommits, regularCommits } =
      this.parseConventionalCommits(commits);

    if (conventionalCommits.length === 0 && regularCommits.length === 0) {
      return "No commits found.";
    }

    let changelog = "";

    if (conventionalCommits.length > 0) {
      const groupedByType = conventionalCommits.reduce((acc, commit) => {
        if (!acc[commit.type]) {
          acc[commit.type] = [];
        }
        acc[commit.type].push(commit);
        return acc;
      }, {});

      Object.entries(groupedByType).forEach(([type, commits]) => {
        const changeType =
          CONVENTIONAL_COMMIT_TYPES[type] || type.toUpperCase();
        changelog += `### ${changeType}\n`;
        commits.forEach((commit) => {
          const scope = commit.scope ? `**${commit.scope}**: ` : "";
          changelog += `- ${scope}${commit.description}\n`;
        });
        changelog += "\n";
      });
    }

    if (regularCommits.length > 0) {
      changelog += "### Other Changes\n";
      regularCommits.forEach((commit) => {
        changelog += `- ${commit.message}\n`;
      });
    }

    return changelog.trim();
  }

  static isConventionalCommit(message) {
    return CONVENTIONAL_COMMIT_REGEX.test(message.split("\n")[0]);
  }

  static getCommitType(message) {
    const match = message.match(CONVENTIONAL_COMMIT_REGEX);
    return match ? match[1] : null;
  }
}

export function testCommitParser() {
  const exampleCommits = [
    {
      sha: "abc1234",
      message: "feat(auth): add user authentication system",
      author: "John Doe",
    },
    {
      sha: "def5678",
      message: "fix: resolve login timeout issue",
      author: "Jane Smith",
    },
    {
      sha: "ghi9012",
      message: "docs(readme): update installation instructions",
      author: "John Doe",
    },
    {
      sha: "jkl3456",
      message: "refactor(api): improve error handling",
      author: "Jane Smith",
    },
    {
      sha: "mno7890",
      message: "update package dependencies",
      author: "John Doe",
    },
  ];

  console.log("=== Commit Parser Test ===");
  console.log("\nExample Commits:");
  exampleCommits.forEach((commit) => {
    console.log(`${commit.sha}: ${commit.message}`);
  });

  const { conventionalCommits, regularCommits } =
    CommitParser.parseConventionalCommits(exampleCommits);

  console.log("\n=== Parsed Results ===");
  console.log(`Conventional commits: ${conventionalCommits.length}`);
  console.log(`Regular commits: ${regularCommits.length}`);

  console.log("\n=== Conventional Commits ===");
  conventionalCommits.forEach((commit) => {
    console.log(
      `Type: ${commit.type}, Scope: ${commit.scope || "none"}, Description: ${
        commit.description
      }`
    );
  });

  console.log("\n=== Generated Changelog ===");
  console.log(CommitParser.formatChangelogFromCommits(exampleCommits));

  return { conventionalCommits, regularCommits };
}
