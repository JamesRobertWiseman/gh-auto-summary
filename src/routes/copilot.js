import express from "express";
import { config } from "../config/index.js";
import { GitHubService } from "../services/githubService.js";
import { oidcService } from "../services/oidcService.js";
import { PRService } from "../services/prService.js";
import { createLogger } from "../utils/logger.js";

const router = express.Router();
const logger = createLogger("CopilotAgent");

/**
 * Middleware to validate Copilot requests
 */
function validateCopilotRequest(req, res, next) {
  // Verify request comes from GitHub Copilot platform
  const publicKeyId = req.headers["x-github-public-key-identifier"];
  const signature = req.headers["x-github-public-key-signature"];

  if (!publicKeyId || !signature) {
    logger.error("Missing Copilot signature headers");
    return res
      .status(401)
      .json({ error: "Unauthorized: Missing signature headers" });
  }

  // TODO: Implement signature verification using GitHub's public key
  // For now, we'll trust the request if headers are present

  next();
}

/**
 * Token exchange endpoint for OIDC
 */
router.post(
  "/token-exchange",
  express.urlencoded({ extended: true }),
  async (req, res) => {
    try {
      if (!config.copilot.oidc.enabled) {
        return res.status(404).json({ error: "OIDC not enabled" });
      }

      logger.debug("Received token exchange request");

      const response = await oidcService.handleTokenExchange(req.body);

      res.json(response);
    } catch (error) {
      logger.error("Token exchange failed:", error.message);
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * Main Copilot agent endpoint - implements Server-Sent Events
 */
router.post(
  "/agent",
  express.json(),
  validateCopilotRequest,
  async (req, res) => {
    try {
      logger.info("Received Copilot agent request");

      // Extract GitHub token from headers
      const githubToken = req.headers["x-github-token"];
      if (!githubToken) {
        return res.status(401).json({ error: "Missing X-GitHub-Token header" });
      }

      // Set up Server-Sent Events
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      });

      // Parse the message from Copilot
      const { messages, references = [] } = req.body;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        sendSSE(res, "error", { error: "Invalid or missing messages" });
        return res.end();
      }

      const userMessage = messages[messages.length - 1];
      logger.debug(`Processing message: ${userMessage.content}`);

      // Send confirmation that we're processing
      sendSSE(res, "copilot_confirmation", {
        type: "action",
        title: "Analyzing Pull Request...",
        message: "I'm analyzing the pull request and generating a summary.",
      });

      // Look for PR references in the context
      const prReference = findPRReference(references, userMessage.content);

      if (prReference) {
        await handlePRAnalysis(
          res,
          prReference,
          githubToken,
          userMessage.content
        );
      } else {
        await handleGeneralAssistance(res, messages, githubToken);
      }

      res.end();
    } catch (error) {
      logger.error("Copilot agent error:", error.message);
      sendSSE(res, "error", {
        error: "Internal server error",
        message: "Sorry, I encountered an error processing your request.",
      });
      res.end();
    }
  }
);

/**
 * Send Server-Sent Event
 */
function sendSSE(res, event, data) {
  if (event) {
    res.write(`event: ${event}\n`);
  }
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Find PR reference in the context or message
 */
function findPRReference(references, messageContent) {
  // Look for explicit PR references from Copilot
  const prReference = references.find(
    (ref) =>
      ref.type === "github.pull_request" ||
      ref.data?.type === "pull_request" ||
      ref.type === "pull_request"
  );

  if (prReference) {
    return prReference;
  }

  // Look for PR URLs in the message content
  const prUrlMatch = messageContent.match(
    /github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/
  );

  if (prUrlMatch) {
    return {
      type: "github.pull_request",
      data: {
        owner: prUrlMatch[1],
        repo: prUrlMatch[2],
        number: parseInt(prUrlMatch[3], 10),
      },
    };
  }

  return null;
}

/**
 * Handle PR analysis requests
 */
async function handlePRAnalysis(res, prReference, githubToken, userMessage) {
  try {
    logger.info("Processing PR analysis request");

    // Parse PR information from reference
    const { owner, repo, number } = parsePRReference(prReference);

    // Send reference to show we found the PR
    sendSSE(res, "copilot_references", [
      {
        type: "github.pull_request",
        id: `pr-${number}`,
        is_implicit: false,
        metadata: {
          display_name: `Pull Request #${number}`,
          display_icon: "git-pull-request",
          display_url: `https://github.com/${owner}/${repo}/pull/${number}`,
        },
      },
    ]);

    // Create GitHub service with user token
    const githubService = new GitHubService();
    githubService.setUserToken(githubToken);

    // Create PR service
    const prService = new PRService();

    // Get PR details
    const pullRequest = await githubService.getPullRequest(owner, repo, number);
    const diff = await githubService.getPullRequestDiff(owner, repo, number);
    const commits = await githubService.getPullRequestCommits(
      owner,
      repo,
      number
    );

    // Generate comprehensive summary
    const summary = await prService.generatePRSummary(
      pullRequest,
      diff,
      commits,
      githubToken
    );

    // Send the final response
    sendSSE(res, "data", {
      id: "response",
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model: "github-copilot",
      choices: [
        {
          index: 0,
          delta: {
            role: "assistant",
            content: `## Pull Request Analysis\n\n**${pullRequest.title}**\n\n${summary}`,
          },
          finish_reason: "stop",
        },
      ],
    });
  } catch (error) {
    logger.error("PR analysis failed:", error.message);
    sendSSE(res, "data", {
      id: "error",
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model: "github-copilot",
      choices: [
        {
          index: 0,
          delta: {
            role: "assistant",
            content: `I couldn't analyze this pull request. Error: ${error.message}\n\nPlease make sure I have access to the repository and the PR exists.`,
          },
          finish_reason: "stop",
        },
      ],
    });
  }
}

/**
 * Handle general AI assistance
 */
async function handleGeneralAssistance(res, messages, githubToken) {
  try {
    logger.info("Processing general assistance request");

    const lastMessage = messages[messages.length - 1];

    let response =
      "I'm a GitHub Auto Summary agent designed to analyze pull requests. ";

    if (
      lastMessage.content.toLowerCase().includes("help") ||
      lastMessage.content.toLowerCase().includes("what can you do")
    ) {
      response += `Here's what I can do:

**Pull Request Analysis:**
- Generate comprehensive summaries of pull requests
- Analyze code changes and their impact
- Extract key information from commits
- Provide structured changelog entries

**How to use me:**
1. Navigate to a pull request on GitHub
2. Open Copilot Chat and mention me: \`@${config.app.name}\`
3. Ask me to analyze or summarize the PR
4. I'll provide a detailed analysis including:
   - Summary of changes
   - Commit analysis
   - Files affected
   - Potential impact

Try asking me: "Analyze this pull request" or "Summarize the changes in this PR"`;
    } else {
      response += `To analyze a pull request, please:
1. Navigate to a GitHub pull request
2. Ask me to "analyze this pull request" or "summarize the changes"

I can provide detailed analysis of code changes, commit history, and generate structured summaries.`;
    }

    sendSSE(res, "data", {
      id: "response",
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model: "github-copilot",
      choices: [
        {
          index: 0,
          delta: {
            role: "assistant",
            content: response,
          },
          finish_reason: "stop",
        },
      ],
    });
  } catch (error) {
    logger.error("General assistance failed:", error.message);
    sendSSE(res, "data", {
      id: "error",
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model: "github-copilot",
      choices: [
        {
          index: 0,
          delta: {
            role: "assistant",
            content:
              "I'm sorry, I couldn't process your request at the moment. Please try again later.",
          },
          finish_reason: "stop",
        },
      ],
    });
  }
}

/**
 * Parse PR reference to extract owner, repo, and number
 */
function parsePRReference(reference) {
  // Handle different reference formats
  if (reference.data?.url) {
    const match = reference.data.url.match(
      /github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/
    );
    if (match) {
      return {
        owner: match[1],
        repo: match[2],
        number: parseInt(match[3], 10),
      };
    }
  }

  if (reference.data?.repository && reference.data?.number) {
    const [owner, repo] = reference.data.repository.split("/");
    return {
      owner,
      repo,
      number: reference.data.number,
    };
  }

  if (reference.data?.owner && reference.data?.repo && reference.data?.number) {
    return {
      owner: reference.data.owner,
      repo: reference.data.repo,
      number: reference.data.number,
    };
  }

  throw new Error("Could not parse PR reference");
}

/**
 * Health check endpoint for Copilot Agent
 */
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    mode: "copilot-agent",
    timestamp: new Date().toISOString(),
  });
});

export { router as copilotRouter };
