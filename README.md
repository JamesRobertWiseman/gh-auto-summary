# GitHub Auto Summary Copilot Agent

A GitHub Copilot Extension agent that provides intelligent pull request analysis and summaries. This agent integrates directly with GitHub Copilot Chat to analyze pull requests, generate comprehensive summaries, and provide structured changelogs.

## Features

- **🤖 Copilot Integration**: Works seamlessly within GitHub Copilot Chat
- **📋 PR Analysis**: Comprehensive analysis of pull requests including:
  - Detailed summaries of changes
  - Impact analysis
  - Structured changelogs
  - Commit analysis with conventional commit support
- **⚡ Real-time**: Provides instant analysis when working with PRs
- **🔒 Secure**: Uses GitHub's authentication system

## How It Works

This Copilot Extension agent:

1. **Receives requests** from GitHub Copilot Chat when you ask for PR analysis
2. **Fetches PR data** using the GitHub API with your authenticated context
3. **Analyzes changes** including diff, commits, and metadata
4. **Generates summaries** using GitHub Copilot's AI capabilities
5. **Returns structured analysis** directly in your chat interface

## Usage

### In GitHub Copilot Chat

1. Navigate to any GitHub pull request
2. Open Copilot Chat (in VS Code, GitHub.com, or GitHub Mobile)
3. Ask the agent to analyze the PR:
   - `@GitHub Auto Summary Copilot Agent analyze this pull request`
   - `@GitHub Auto Summary summarize the changes in this PR`
   - `What changes does this PR make?`

### Example Interactions

**Analyze a PR:**
```
@GitHub Auto Summary analyze this pull request
```

**Get help:**
```
@GitHub Auto Summary what can you do?
```

The agent will provide:
- **Summary**: Overview of what the PR accomplishes
- **Key Changes**: Main technical changes made
- **Impact**: How changes affect the codebase
- **Changelog**: Structured list suitable for release notes

## Installation & Setup

### Prerequisites

- GitHub App with appropriate permissions
- GitHub Copilot subscription
- Node.js 18+ 

### Environment Variables

```bash
# Required
GITHUB_APP_ID=your_github_app_id
GITHUB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Optional
GITHUB_CLIENT_ID=your_github_client_id  # For OIDC if needed
GITHUB_CLIENT_SECRET=your_client_secret
COPILOT_OIDC_ENABLED=false  # Enable OIDC token exchange if needed
```

### GitHub App Configuration

Your GitHub App needs these permissions:
- **Contents**: Read (to access repository files)
- **Metadata**: Read (to access repository metadata)  
- **Pull requests**: Read (to access PR data)

And should be configured as a Copilot Extension:
- Enable "GitHub Copilot Extension" in your app settings
- Set the agent endpoint URL: `https://your-domain.com/copilot/agent`

### Deployment

```bash
# Install dependencies
npm install

# Start the agent
npm start
```

The agent will be available at `/copilot/agent` for Copilot platform requests.

### Local Development

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev
```

## API Endpoints

- `POST /copilot/agent` - Main Copilot agent endpoint (handles Copilot platform requests)
- `POST /copilot/token-exchange` - OIDC token exchange (if enabled)
- `GET /copilot/health` - Health check
- `GET /` - Service status

## Architecture

```mermaid
graph TD
    A[GitHub Copilot Chat] -->|User Request| B[Copilot Platform]
    B -->|HTTP POST| C[Copilot Agent]
    C -->|X-GitHub-Token| D[GitHub API]
    D -->|PR Data| C
    C -->|Analysis Prompt| E[GitHub Copilot API]
    E -->|Generated Summary| C
    C -->|Server-Sent Events| B
    B -->|Response| A
```

## Security

- Uses GitHub's authentication system via X-GitHub-Token header
- Validates requests from GitHub Copilot platform
- No persistent storage of user data
- Respects GitHub repository permissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in this repository
- Contact the maintainers

---

Built with ❤️ for the GitHub developer community
