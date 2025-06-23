export const PR_CONSTANTS = {
  AUTO_SUMMARY_TAG: "[GHAutoSummary]",
  SUMMARY_MARKER: "<!-- AUTO-GENERATED-SUMMARY -->",
  END_MARKER: "<!-- END-AUTO-GENERATED-SUMMARY -->",
  VALID_ACTIONS: ["opened", "synchronize", "reopened"],
  MAX_DIFF_LENGTH: 8000,
};

export const HTTP_STATUS = {
  OK: 200,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
};

export const CONVENTIONAL_COMMIT_TYPES = {
  feat: "Added",
  fix: "Fixed",
  docs: "Documentation",
  style: "Style",
  refactor: "Refactored",
  perf: "Performance",
  test: "Testing",
  build: "Build",
  ci: "CI/CD",
  chore: "Maintenance",
  revert: "Reverted",
};

export const CONVENTIONAL_COMMIT_REGEX =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?\!?:\s(.+)/;
