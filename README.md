# GitHub Auto Summary Extension

This GitHub Copilot extension automatically generates PR summaries and changelogs when pull requests contain the `[GHAutoSummary]` tag.

## Features

- 🤖 **Auto PR Summary**: Automatically generates summaries and changelogs for tagged PRs
- 📝 **Commit-Based Changelog**: Uses commit messages to create structured changelogs
- 🎯 **Conventional Commits**: Supports conventional commit format for better changelog organization
- 🔄 **Webhook Integration**: Responds to GitHub PR events in real-time
- 🛡️ **Secure**: Uses GitHub webhook signature verification

## Enhanced Changelog Generation

The extension now analyzes both **code diffs** AND **commit messages** to generate comprehensive summaries and changelogs:

### Conventional Commits Support

When your PR contains [conventional commits](https://www.conventionalcommits.org/), the extension automatically:\

- **Parses commit types**: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
- **Groups by change type**: Added, Fixed, Documentation, etc.
- **Extracts scopes**: Groups related changes together
- **Creates structured changelog**: Professional, categorized format

### Supported Conventional Commit Types

- `feat`: **Added** - New features
- `fix`: **Fixed** - Bug fixes  
- `docs`: **Documentation** - Documentation changes
- `style`: **Style** - Code style changes
- `refactor`: **Refactored** - Code refactoring
- `perf`: **Performance** - Performance improvements
- `test`: **Testing** - Test additions/changes
- `build`: **Build** - Build system changes
- `ci`: **CI/CD** - CI/CD changes
- `chore`: **Maintenance** - Maintenance tasks

### Example Conventional Commits

```bash
feat(auth): add user authentication system
fix: resolve login timeout issue  
docs(readme): update installation instructions
refactor(api): improve error handling
```

### Fallback for Regular Commits

If your PR doesn't use conventional commits, the extension will still:

- Use plain commit messages for changelog generation
- Group similar changes logically
- Focus on user-facing improvements

## Project Structure

```text
gh-auto-summary/
├── index.js                    # Application entry point
├── src/
│   ├── app.js                  # Main Express application
│   │   └── index.js           # Configuration management
│   ├── middleware/
│   │   └── webhookVerification.js  # GitHub webhook verification
│   ├── services/
│   │   ├── githubService.js   # GitHub API interactions
│   │   ├── llmService.js      # AI/LLM integrations
│   │   └── prService.js       # Pull request processing logic
│   ├── routes/
│   │   ├── copilot.js         # Copilot chat endpoints
│   │   └── webhook.js         # GitHub webhook handlers
│   └── utils/
│       ├── constants.js       # Application constants
│       ├── logger.js          # Logging utilities
│       └── commitParser.js    # Commit parsing utilities
├── .env.example               # Environment configuration template
├── package.json
└── README.md
```

## Architecture

The application follows a layered architecture pattern:

- **Routes Layer**: Handle HTTP requests and responses
- **Service Layer**: Business logic and external API integrations
- **Middleware Layer**: Request processing and validation
- **Utilities Layer**: Shared functionality and constants

### Key Components

- **GitHubService**: Manages all GitHub API interactions (user info, PR data, commits, updates)
- **LLMService**: Handles AI-powered content generation using GitHub Copilot API with commit message analysis
- **PRService**: Orchestrates PR processing workflow (validation, summary generation, updates)
- **CommitParser**: Parses conventional commits and generates structured changelogs
- **Logger**: Provides structured logging across all components
- **Config**: Centralized configuration management with validation

## Setup

### 1. Environment Variables

Create a `.env` file or set these environment variables:

```bash
# Required: GitHub token with repo access
GITHUB_TOKEN=your_github_token_here

# Optional: Webhook secret for security (recommended for production)
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# Optional: Port (defaults to 3000)
PORT=3000

# Optional: Environment (development/production)
NODE_ENV=development
```

You can copy `.env.example` to `.env` and update the values.

### 2. GitHub Token Setup

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Create a new token with these permissions:
   - `repo` (Full control of private repositories)
   - `pull_requests:write` (Write access to pull requests)
3. Add the token to your `GITHUB_TOKEN` environment variable

### 3. Webhook Configuration

1. In your GitHub repository, go to Settings → Webhooks
2. Click "Add webhook"
3. Set Payload URL to: `https://your-domain.com/webhook`
4. Set Content type to: `application/json`
5. Set Secret to your `GITHUB_WEBHOOK_SECRET` (optional but recommended)
6. Select "Pull requests" event
7. Click "Add webhook"

### 4. Deploy and Run

```bash
# Install dependencies
npm install

# Run in development (with auto-reload)
npm run dev

# Run in production
npm start
```

## Usage

### Auto PR Summary

To automatically generate a summary and changelog for a pull request:

1. Create a new PR or edit an existing one
2. Add `[GHAutoSummary]` anywhere in the PR title or description
3. The extension will automatically:
   - Fetch all commit messages from the PR
   - Analyze the code diff
   - Parse conventional commits (if present)
   - Generate a comprehensive summary using GitHub's LLM
   - Create a structured changelog
   - Update the PR description with the generated content

#### Example PR Title

```markdown
[GHAutoSummary] Add user authentication feature
```

#### Example PR Description

```markdown
This PR adds user authentication functionality.

[GHAutoSummary]

- Added login/logout endpoints
- Implemented JWT token handling
- Added user session management
```

### Generated Output Format

#### With Conventional Commits

```markdown
<!-- AUTO-GENERATED-SUMMARY -->
## Summary
Added comprehensive user authentication system with JWT token handling and session management capabilities.

## Changelog
### Added
- **auth**: User authentication system with login/logout endpoints
- **security**: JWT token handling and validation
- **session**: User session management with automatic cleanup

### Fixed  
- Login timeout issues during peak usage
- Session persistence across browser restarts

### Documentation
- **readme**: Updated installation and setup instructions
<!-- END-AUTO-GENERATED-SUMMARY -->
```

#### With Regular Commits

```markdown
<!-- AUTO-GENERATED-SUMMARY -->
## Summary
Enhanced user management system with improved authentication and better error handling.

## Changelog
### Changes
- Add user authentication endpoints
- Implement JWT token system  
- Fix login timeout issues
- Update documentation and examples
- Refactor error handling logic
<!-- END-AUTO-GENERATED-SUMMARY -->
```

## API Endpoints

- `POST /webhook` - GitHub webhook handler for PR events
- `GET /health` - Health check endpoint

## Development

The extension uses:

- **Express.js** for the web server
- **Octokit** for GitHub API interactions
- **GitHub Copilot API** for LLM-powered summaries
- **Crypto** for webhook signature verification
- **Dotenv** for environment variable management

### Adding New Features

1. **New Routes**: Add to `src/routes/`
2. **Business Logic**: Add to `src/services/`
3. **Middleware**: Add to `src/middleware/`
4. **Configuration**: Update `src/config/index.js`
5. **Constants**: Add to `src/utils/constants.js`
6. **Utilities**: Add to `src/utils/`

### Logging

Use the logger utility for consistent logging:

```javascript
import { createLogger } from '../utils/logger.js';
const logger = createLogger('YourComponent');

logger.info('Information message');
logger.error('Error message', error);
logger.debug('Debug message'); // Only in development
```

### Commit Message Best Practices

For best results with the automatic changelog generation, use conventional commits:

```bash
# Feature additions
feat(scope): add new feature
feat: add user authentication

# Bug fixes  
fix(scope): resolve specific issue
fix: resolve login timeout

# Documentation
docs: update README instructions
docs(api): add endpoint documentation

# Refactoring
refactor(auth): improve error handling
refactor: simplify user validation logic
```

## Security Notes

- Always use HTTPS in production
- Set up webhook secrets for secure communication
- Limit GitHub token permissions to minimum required
- Consider rate limiting for production deployments
- Environment variables are validated on startup

## Troubleshooting

### Common Issues

1. **Webhook not triggering**: Check that the webhook URL is accessible and the secret matches
2. **Permission errors**: Ensure your GitHub token has `repo` and `pull_requests:write` permissions
3. **LLM API errors**: Verify your token has access to GitHub Copilot API
4. **Configuration errors**: Check that all required environment variables are set
5. **Commit parsing issues**: Ensure conventional commits follow the standard format

### Debug Logs

The application logs important events:

- Webhook events received
- PR processing status
- Commit parsing results
- API errors and responses
- Configuration validation

Set `NODE_ENV=development` to see debug logs.

### Enhanced Logging

The extension now provides detailed logging for commit processing:

- Number of commits processed
- Conventional vs regular commit detection
- Commit parsing results
- Changelog generation status

Check your server logs for detailed debugging information.

## Documentation

- [Using Copilot Extensions](https://docs.github.com/en/copilot/using-github-copilot/using-extensions-to-integrate-external-tools-with-copilot-chat)
- [About building Copilot Extensions](https://docs.github.com/en/copilot/building-copilot-extensions/about-building-copilot-extensions)
- [Set up process](https://docs.github.com/en/copilot/building-copilot-extensions/setting-up-copilot-extensions)
- [Communicating with the Copilot platform](https://docs.github.com/en/copilot/building-copilot-extensions/building-a-copilot-agent-for-your-copilot-extension/configuring-your-copilot-agent-to-communicate-with-the-copilot-platform)
- [Communicating with GitHub](https://docs.github.com/en/copilot/building-copilot-extensions/building-a-copilot-agent-for-your-copilot-extension/configuring-your-copilot-agent-to-communicate-with-github)
