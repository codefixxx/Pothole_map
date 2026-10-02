/**
 * Centralized Application Logger & Error Tracker
 * Provides structured logging for production and integration hooks for error monitoring (e.g., Sentry).
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isProd = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    if (this.isProd) {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...context,
      });
    }
    const ctxString = context && Object.keys(context).length > 0 ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${ctxString}`;
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errObj = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { rawError: error };
    const mergedContext = { ...context, error: errObj };
    
    console.error(this.formatMessage('error', message, mergedContext));

    // Optional Sentry / Telemetry hook
    if (process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN) {
      // Sentry hook can be attached here if initialized
    }
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.APP_DEBUG === 'true' || !this.isProd) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }
}

export const logger = new Logger();
