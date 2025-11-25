import type {
  Logger,
  LogContext,
  LogEntry,
  LogLevel,
  LogTransport,
  LoggerOptions,
  TimerEndFn,
  LOG_LEVEL_PRIORITY,
} from './types';
import { LOG_LEVEL_PRIORITY as PRIORITY } from './types';

/**
 * Base logger implementation that can be extended for different environments
 */
export class BaseLogger implements Logger {
  protected name: string;
  protected level: LogLevel;
  protected defaultContext: LogContext;
  protected transports: LogTransport[];
  protected structured: boolean;

  constructor(options: LoggerOptions) {
    this.name = options.name;
    this.level = options.level ?? 'info';
    this.defaultContext = {
      component: options.name,
      pid: typeof process !== 'undefined' ? process.pid : undefined,
      ...options.defaultContext,
    };
    this.transports = options.transports ?? [];
    this.structured = options.structured ?? true;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  isLevelEnabled(level: LogLevel): boolean {
    return PRIORITY[level] <= PRIORITY[this.level];
  }

  protected createEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...this.defaultContext, ...context },
      __structured: this.structured,
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

  protected writeToTransports(entry: LogEntry): void {
    for (const transport of this.transports) {
      if (this.isLevelEnabled(transport.level)) {
        try {
          transport.write(entry);
        } catch (err) {
          // Silently ignore transport errors to prevent logging from crashing the app
          console.error(`Logger transport "${transport.name}" error:`, err);
        }
      }
    }
  }

  protected log(
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
    this.writeToTransports(entry);
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
    return new BaseLogger({
      name: this.name,
      level: this.level,
      defaultContext: { ...this.defaultContext, ...context },
      transports: this.transports,
      structured: this.structured,
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

  /**
   * Add a transport to this logger
   */
  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  /**
   * Remove a transport by name
   */
  removeTransport(name: string): void {
    this.transports = this.transports.filter((t) => t.name !== name);
  }

  /**
   * Flush all transports
   */
  async flush(): Promise<void> {
    await Promise.all(
      this.transports.map((t) => t.flush?.()).filter(Boolean)
    );
  }

  /**
   * Close all transports
   */
  async close(): Promise<void> {
    await Promise.all(
      this.transports.map((t) => t.close?.()).filter(Boolean)
    );
  }
}

/**
 * Create a logger instance
 */
export function createLogger(options: LoggerOptions): BaseLogger {
  return new BaseLogger(options);
}
