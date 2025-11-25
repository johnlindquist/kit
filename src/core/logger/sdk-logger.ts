/**
 * SDK Logger
 *
 * Lightweight logger for Script Kit SDK scripts.
 * Designed for script execution contexts with:
 * - Console-based output (no file dependencies during script execution)
 * - Script path and execution context tracking
 * - Pretty formatting for development
 * - JSON formatting when in workflow/automation contexts
 */

import type { Logger, LogLevel, LogContext, LogEntry, TimerEndFn } from './types';
import { LOG_LEVEL_PRIORITY } from './types';
import { PrettyFormatter, JSONFormatter, createFormatter } from './formatters';
import { createRedactor, DEFAULT_REDACTION_PATHS } from './redaction';
import { getCorrelationId, getParentId } from './correlation';

/**
 * SDK Logger options
 */
export interface SDKLoggerOptions {
  /** Logger name (typically script name or path) */
  name: string;

  /** Log level (default: 'info') */
  level?: LogLevel;

  /** Default context to include in all log entries */
  defaultContext?: LogContext;

  /** Use JSON format (default: false for console, true for workflow context) */
  json?: boolean;

  /** Enable colors in output (default: true for TTY, false otherwise) */
  colors?: boolean;

  /** Enable sensitive data redaction (default: true) */
  redaction?: boolean;

  /** Custom output function (default: console methods) */
  output?: (level: LogLevel, message: string) => void;
}

/**
 * SDK Logger class
 */
export class SDKLogger implements Logger {
  private name: string;
  private level: LogLevel;
  private defaultContext: LogContext;
  private formatter: PrettyFormatter | JSONFormatter;
  private redactor: ReturnType<typeof createRedactor>;
  private output: (level: LogLevel, message: string) => void;

  constructor(options: SDKLoggerOptions) {
    this.name = options.name;
    this.level = options.level ?? 'info';
    this.defaultContext = {
      component: options.name,
      pid: process.pid,
      ...options.defaultContext,
    };

    // Determine if we're in a workflow/automation context
    const isWorkflow = process.env.KIT_CONTEXT === 'workflow' ||
                       process.env.KIT_MODE === 'workflow' ||
                       process.env.CI === 'true';

    // Use JSON in workflow contexts or when explicitly requested
    const useJson = options.json ?? isWorkflow;

    // Enable colors for TTY unless disabled or in workflow
    const useColors = options.colors ?? (process.stdout.isTTY && !isWorkflow);

    // Create formatter
    this.formatter = useJson
      ? new JSONFormatter()
      : new PrettyFormatter({ useColors });

    // Create redactor
    this.redactor = createRedactor({
      enabled: options.redaction !== false,
      paths: DEFAULT_REDACTION_PATHS,
    });

    // Set output function
    this.output = options.output ?? defaultOutput;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  isLevelEnabled(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] <= LOG_LEVEL_PRIORITY[this.level];
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const correlationId = getCorrelationId();
    const parentId = getParentId();

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: {
        ...this.defaultContext,
        ...context,
        ...(correlationId && { correlationId }),
        ...(parentId && { parentId }),
      },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as NodeJS.ErrnoException).code,
        cause: error.cause,
      };
    }

    return entry;
  }

  private writeLog(entry: LogEntry): void {
    // Redact sensitive data
    const redactedEntry = this.redactor.redact(entry);

    // Format the entry
    const formatted = this.formatter.format(redactedEntry);

    // Output
    this.output(entry.level, formatted);
  }

  private log(
    level: LogLevel,
    message: string,
    errorOrContext?: Error | LogContext,
    context?: LogContext
  ): void {
    if (!this.isLevelEnabled(level)) return;

    let error: Error | undefined;
    let ctx: LogContext | undefined;

    if (errorOrContext instanceof Error) {
      error = errorOrContext;
      ctx = context;
    } else {
      ctx = errorOrContext;
    }

    const entry = this.createEntry(level, message, ctx, error);
    this.writeLog(entry);
  }

  fatal(message: string, errorOrContext?: Error | LogContext, context?: LogContext): void {
    this.log('fatal', message, errorOrContext, context);
  }

  error(message: string, errorOrContext?: Error | LogContext, context?: LogContext): void {
    this.log('error', message, errorOrContext, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  trace(message: string, context?: LogContext): void {
    this.log('trace', message, context);
  }

  child(context: LogContext): Logger {
    return new SDKLogger({
      name: this.name,
      level: this.level,
      defaultContext: { ...this.defaultContext, ...context },
      json: this.formatter instanceof JSONFormatter,
      redaction: true,
      output: this.output,
    });
  }

  startTimer(operationName: string, context?: LogContext): TimerEndFn {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.debug(`${operationName} completed`, {
        ...context,
        duration,
        operationName,
      });
      return duration;
    };
  }
}

/**
 * Default output function using console
 */
function defaultOutput(level: LogLevel, message: string): void {
  switch (level) {
    case 'fatal':
    case 'error':
      console.error(message);
      break;
    case 'warn':
      console.warn(message);
      break;
    case 'debug':
    case 'trace':
      console.debug(message);
      break;
    default:
      console.log(message);
  }
}

/**
 * Create an SDK logger for a script
 */
export function createSDKLogger(options: SDKLoggerOptions): SDKLogger {
  return new SDKLogger(options);
}

/**
 * Create a logger for a script with automatic name detection
 */
export function createScriptLogger(
  scriptPath?: string,
  options?: Omit<SDKLoggerOptions, 'name'>
): SDKLogger {
  const path = require('node:path');

  // Try to get script name from path or environment
  let name: string;
  if (scriptPath) {
    name = path.basename(scriptPath, path.extname(scriptPath));
  } else if (process.env.KIT_SCRIPT) {
    name = path.basename(process.env.KIT_SCRIPT, path.extname(process.env.KIT_SCRIPT));
  } else {
    name = 'script';
  }

  return new SDKLogger({
    ...options,
    name,
    defaultContext: {
      ...(scriptPath && { scriptPath }),
      ...options?.defaultContext,
    },
  });
}

/**
 * Global SDK logger instance
 * Use this for general SDK logging
 */
let globalSDKLogger: SDKLogger | null = null;

/**
 * Get or create the global SDK logger
 */
export function getSDKLogger(): SDKLogger {
  if (!globalSDKLogger) {
    globalSDKLogger = createSDKLogger({
      name: 'sdk',
      level: (process.env.LOG_LEVEL as LogLevel) || 'info',
    });
  }
  return globalSDKLogger;
}

/**
 * Set the global SDK logger
 */
export function setSDKLogger(logger: SDKLogger): void {
  globalSDKLogger = logger;
}

/**
 * Convenience function for quick logging
 */
export const sdkLog = {
  fatal: (message: string, errorOrContext?: Error | LogContext, context?: LogContext) =>
    getSDKLogger().fatal(message, errorOrContext, context),
  error: (message: string, errorOrContext?: Error | LogContext, context?: LogContext) =>
    getSDKLogger().error(message, errorOrContext, context),
  warn: (message: string, context?: LogContext) =>
    getSDKLogger().warn(message, context),
  info: (message: string, context?: LogContext) =>
    getSDKLogger().info(message, context),
  debug: (message: string, context?: LogContext) =>
    getSDKLogger().debug(message, context),
  trace: (message: string, context?: LogContext) =>
    getSDKLogger().trace(message, context),
};
