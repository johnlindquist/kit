/**
 * Standard log levels following severity order
 * fatal > error > warn > info > debug > trace
 */
export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

/**
 * Numeric priority for log levels (lower = more severe)
 */
export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

/**
 * Context information attached to log entries
 */
export interface LogContext {
  /** Unique request/operation ID for tracing across processes */
  correlationId?: string;
  /** Parent correlation ID for nested operations */
  parentId?: string;
  /** User identifier (will be redacted in production if configured) */
  userId?: string;
  /** Script path being executed */
  scriptPath?: string;
  /** Component/module name generating the log */
  component?: string;
  /** Process ID */
  pid?: number;
  /** Additional metadata */
  [key: string]: unknown;
}

/**
 * Structured log entry format
 */
export interface LogEntry {
  /** Log severity level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Contextual information */
  context?: LogContext;
  /** Error details if applicable */
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
    cause?: unknown;
  };
  /** Operation duration in milliseconds */
  duration?: number;
  /** Marker for structured log detection */
  __structured?: boolean;
  /** Allow additional fields */
  [key: string]: unknown;
}

/**
 * Timer function returned by startTimer
 */
export type TimerEndFn = () => number;

/**
 * Core logger interface
 */
export interface Logger {
  /** Log fatal error (system is unusable) */
  fatal(message: string, context?: LogContext): void;
  fatal(message: string, error: Error, context?: LogContext): void;

  /** Log error (operation failed) */
  error(message: string, context?: LogContext): void;
  error(message: string, error: Error, context?: LogContext): void;

  /** Log warning (potential issue) */
  warn(message: string, context?: LogContext): void;

  /** Log informational message */
  info(message: string, context?: LogContext): void;

  /** Log debug information */
  debug(message: string, context?: LogContext): void;

  /** Log trace/verbose information */
  trace(message: string, context?: LogContext): void;

  /** Create child logger with preset context */
  child(context: LogContext): Logger;

  /** Start timing an operation, returns function to call when done */
  startTimer(operationName: string, context?: LogContext): TimerEndFn;

  /** Get the current log level */
  getLevel(): LogLevel;

  /** Set the log level */
  setLevel(level: LogLevel): void;

  /** Check if a level would be logged */
  isLevelEnabled(level: LogLevel): boolean;
}

/**
 * Logger with additional path information for file-based logging
 */
export interface LoggerWithPath extends Logger {
  /** Path to the log file */
  logPath: string;
  /** Clear/truncate the log file */
  clear(): void;
}

/**
 * Transport interface for sending logs to different destinations
 */
export interface LogTransport {
  /** Transport name for identification */
  name: string;
  /** Minimum level this transport handles */
  level: LogLevel;
  /** Write a log entry */
  write(entry: LogEntry): void | Promise<void>;
  /** Flush any buffered entries */
  flush?(): void | Promise<void>;
  /** Close the transport */
  close?(): void | Promise<void>;
}

/**
 * Logger factory options
 */
export interface LoggerOptions {
  /** Logger name/component */
  name: string;
  /** Minimum log level */
  level?: LogLevel;
  /** Default context to include in all logs */
  defaultContext?: LogContext;
  /** Transports to use */
  transports?: LogTransport[];
  /** Enable structured JSON output */
  structured?: boolean;
  /** Redaction configuration */
  redaction?: {
    enabled?: boolean;
    paths?: string[];
    censor?: string;
  };
}

/**
 * Performance measurement options
 */
export interface PerfOptions {
  /** Only log if duration exceeds this threshold (ms) */
  thresholdMs?: number;
  /** Additional context to include */
  context?: LogContext;
}

/**
 * Performance statistics for batch operations
 */
export interface PerfStats {
  count: number;
  totalMs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
}
