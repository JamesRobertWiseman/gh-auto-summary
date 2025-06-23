class Logger {
  constructor(context = "App") {
    this.context = context;
  }

  log(message, ...args) {
    console.log(
      `[${new Date().toISOString()}] [${this.context}] ${message}`,
      ...args
    );
  }

  info(message, ...args) {
    console.info(
      `[${new Date().toISOString()}] [${this.context}] INFO: ${message}`,
      ...args
    );
  }

  warn(message, ...args) {
    console.warn(
      `[${new Date().toISOString()}] [${this.context}] WARN: ${message}`,
      ...args
    );
  }

  error(message, ...args) {
    console.error(
      `[${new Date().toISOString()}] [${this.context}] ERROR: ${message}`,
      ...args
    );
  }

  debug(message, ...args) {
    if (process.env.NODE_ENV === "development") {
      console.debug(
        `[${new Date().toISOString()}] [${this.context}] DEBUG: ${message}`,
        ...args
      );
    }
  }
}

export function createLogger(context) {
  return new Logger(context);
}

export const logger = new Logger();
