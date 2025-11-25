import type { LogEntry, LogLevel } from './types';

/**
 * Log formatter interface
 */
export interface LogFormatter {
  format(entry: LogEntry): string;
}

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
} as const;

/**
 * Level-specific colors
 */
const LEVEL_COLORS: Record<LogLevel, string> = {
  fatal: COLORS.red + COLORS.bold,
  error: COLORS.red,
  warn: COLORS.yellow,
  info: COLORS.blue,
  debug: COLORS.cyan,
  trace: COLORS.gray,
};

/**
 * JSON formatter for production/structured logging
 * Outputs newline-delimited JSON (NDJSON) format
 */
export class JSONFormatter implements LogFormatter {
  private prettyPrint: boolean;

  constructor(options: { prettyPrint?: boolean } = {}) {
    this.prettyPrint = options.prettyPrint ?? false;
  }

  format(entry: LogEntry): string {
    // Create a clean copy without internal markers
    const output: Record<string, unknown> = {
      '@timestamp': entry.timestamp,
      level: entry.level.toUpperCase(),
      message: entry.message,
    };

    // Add context fields at top level for easier querying
    if (entry.context) {
      const { component, correlationId, ...rest } = entry.context;
      if (component) output.component = component;
      if (correlationId) output.correlationId = correlationId;
      if (Object.keys(rest).length > 0) {
        output.context = rest;
      }
    }

    // Add error details
    if (entry.error) {
      output.error = entry.error;
    }

    // Add duration for performance logs
    if (entry.duration !== undefined) {
      output.duration = entry.duration;
    }

    // Add any additional fields (except internal markers)
    for (const [key, value] of Object.entries(entry)) {
      if (
        !['level', 'message', 'timestamp', 'context', 'error', 'duration', '__structured'].includes(key)
      ) {
        output[key] = value;
      }
    }

    return this.prettyPrint
      ? JSON.stringify(output, null, 2)
      : JSON.stringify(output);
  }
}

/**
 * Pretty formatter for development - human-readable colored output
 */
export class PrettyFormatter implements LogFormatter {
  private useColors: boolean;
  private showTimestamp: boolean;

  constructor(options: { useColors?: boolean; showTimestamp?: boolean } = {}) {
    this.useColors = options.useColors ?? true;
    this.showTimestamp = options.showTimestamp ?? true;
  }

  format(entry: LogEntry): string {
    const parts: string[] = [];

    // Timestamp
    if (this.showTimestamp) {
      const timestamp = this.formatTimestamp(entry.timestamp);
      parts.push(this.colorize(timestamp, COLORS.gray));
    }

    // Level
    const level = entry.level.toUpperCase().padEnd(5);
    parts.push(this.colorize(level, LEVEL_COLORS[entry.level]));

    // Component
    if (entry.context?.component) {
      parts.push(this.colorize(`[${entry.context.component}]`, COLORS.cyan));
    }

    // Correlation ID (shortened)
    if (entry.context?.correlationId) {
      const shortId = entry.context.correlationId.slice(0, 8);
      parts.push(this.colorize(`(${shortId})`, COLORS.magenta));
    }

    // Message
    parts.push(entry.message);

    // Duration
    if (entry.duration !== undefined) {
      const durationStr = `(${entry.duration.toFixed(2)}ms)`;
      parts.push(this.colorize(durationStr, COLORS.yellow));
    }

    // Additional context (excluding standard fields)
    const extraContext = this.getExtraContext(entry.context);
    if (extraContext) {
      parts.push(this.colorize(extraContext, COLORS.gray));
    }

    let output = parts.join(' ');

    // Error stack trace on new line
    if (entry.error?.stack) {
      output += '\n' + this.colorize(entry.error.stack, COLORS.red);
    }

    return output;
  }

  private formatTimestamp(isoString: string): string {
    // Extract time portion: HH:MM:SS.mmm
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
  }

  private colorize(text: string, color: string): string {
    if (!this.useColors) return text;
    return `${color}${text}${COLORS.reset}`;
  }

  private getExtraContext(context?: Record<string, unknown>): string | null {
    if (!context) return null;

    const excluded = ['component', 'correlationId', 'parentId', 'pid'];
    const extra: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(context)) {
      if (!excluded.includes(key) && value !== undefined) {
        extra[key] = value;
      }
    }

    if (Object.keys(extra).length === 0) return null;

    // Format as key=value pairs
    const pairs = Object.entries(extra).map(([k, v]) => {
      if (typeof v === 'string') {
        return `${k}="${v.slice(0, 50)}${v.length > 50 ? '...' : ''}"`;
      }
      return `${k}=${JSON.stringify(v)}`;
    });

    return `{ ${pairs.join(', ')} }`;
  }
}

/**
 * Minimal formatter - just level and message
 */
export class MinimalFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    return `[${entry.level.toUpperCase()}] ${entry.message}`;
  }
}

/**
 * File-safe formatter - like pretty but without ANSI codes
 */
export class FileFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const parts: string[] = [];

    // Full timestamp for files
    parts.push(`[${entry.timestamp}]`);

    // Level
    parts.push(`[${entry.level.toUpperCase()}]`);

    // Component
    if (entry.context?.component) {
      parts.push(`[${entry.context.component}]`);
    }

    // Message
    parts.push(entry.message);

    // Duration
    if (entry.duration !== undefined) {
      parts.push(`(${entry.duration.toFixed(2)}ms)`);
    }

    let output = parts.join(' ');

    // Error stack
    if (entry.error?.stack) {
      output += '\n' + entry.error.stack;
    }

    return output;
  }
}

/**
 * Strip ANSI escape codes from a string
 */
export function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Create the appropriate formatter based on environment
 */
export function createFormatter(options: {
  format?: 'json' | 'pretty' | 'minimal' | 'file';
  env?: string;
  forceJson?: boolean;
  useColors?: boolean;
} = {}): LogFormatter {
  const {
    format,
    env = process.env.NODE_ENV,
    forceJson = process.env.LOG_FORMAT === 'json',
    useColors = process.stdout?.isTTY ?? true,
  } = options;

  // Explicit format takes precedence
  if (format) {
    switch (format) {
      case 'json':
        return new JSONFormatter();
      case 'pretty':
        return new PrettyFormatter({ useColors });
      case 'minimal':
        return new MinimalFormatter();
      case 'file':
        return new FileFormatter();
    }
  }

  // Environment-based selection
  if (forceJson || env === 'production') {
    return new JSONFormatter();
  }

  return new PrettyFormatter({ useColors });
}
