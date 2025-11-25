/**
 * @script-kit/logger
 *
 * Unified logging package for Script Kit ecosystem.
 * Provides structured logging, correlation tracking, redaction, and rotation.
 */

// Core types
export type {
  LogLevel,
  LogContext,
  LogEntry,
  Logger,
  LoggerWithPath,
  LogTransport,
  LoggerOptions,
  TimerEndFn,
  PerfOptions,
  PerfStats,
} from './types';

export { LOG_LEVEL_PRIORITY } from './types';

// Base logger
export { BaseLogger, createLogger } from './base-logger';

// Formatters
export {
  type LogFormatter,
  JSONFormatter,
  PrettyFormatter,
  MinimalFormatter,
  FileFormatter,
  stripAnsi,
  createFormatter,
} from './formatters';

// Redaction
export {
  type RedactionConfig,
  DEFAULT_REDACTION_PATHS,
  createRedactor,
  redact,
  shouldRedact,
  redactString,
  maskString,
} from './redaction';

// Correlation
export {
  type CorrelationContext,
  generateCorrelationId,
  generateShortCorrelationId,
  getCorrelationContext,
  getCorrelationId,
  getParentId,
  getCorrelationMetadata,
  withCorrelation,
  withCorrelationAsync,
  createChildContext,
  withChildCorrelation,
  withChildCorrelationAsync,
  addCorrelationMetadata,
  getElapsedTime,
  getCorrelationHeaders,
  correlationContextFromHeaders,
  correlationMiddleware,
  withCorrelationContext,
  bindCorrelationContext,
  correlationStorage,
} from './correlation';

// Rotation
export {
  type RotationConfig,
  type RotationCheckResult,
  type RotatedFileInfo,
  DEFAULT_ROTATION_CONFIG,
  formatDate,
  shouldRotate,
  getRotatedFiles,
  rotateFile,
  compressFile,
  decompressFile,
  cleanupOldFiles,
  getTotalLogSize,
  RotatingWriteStream,
  createRotatingStream,
} from './rotation';

// Configuration
export {
  type LogEnvVars,
  type LoggerConfig,
  DEFAULT_CONFIG,
  parseLogLevel,
  parseBoolean,
  loadConfigFromEnv,
  createLoggerOptionsFromConfig,
  getEnvironmentConfig,
  COMPONENT_CONFIGS,
  getComponentConfig,
  mergeConfigs,
  validateConfig,
} from './config';

// SDK Logger
export {
  type SDKLoggerOptions,
  SDKLogger,
  createSDKLogger,
  createScriptLogger,
  getSDKLogger,
  setSDKLogger,
  sdkLog,
} from './sdk-logger';

// Error Aggregation
export {
  type ErrorSummary,
  type ErrorAggregatorConfig,
  ErrorAggregator,
  createErrorAggregator,
  getErrorAggregator,
  setErrorAggregator,
} from './error-aggregator';

import type { LogLevel as LogLevelType } from './types';

/**
 * Quick start: Create a logger with sensible defaults
 *
 * @example
 * ```ts
 * import { quickLogger } from '@script-kit/logger';
 *
 * const log = quickLogger('my-component');
 * log.info('Hello world');
 * log.error('Something went wrong', new Error('oops'));
 * ```
 */
export function quickLogger(name: string, level?: LogLevelType) {
  const { loadConfigFromEnv, createLoggerOptionsFromConfig } = require('./config');
  const { createLogger } = require('./base-logger');
  const { createFormatter } = require('./formatters');
  const { createRedactor } = require('./redaction');

  const config = loadConfigFromEnv();
  const options = createLoggerOptionsFromConfig(name, config);

  if (level) {
    options.level = level;
  }

  const formatter = createFormatter({
    format: config.format,
    useColors: config.colors,
    env: config.isProduction ? 'production' : 'development',
  });

  const redactor = createRedactor(config.redaction);

  // Create a console transport
  const consoleTransport = {
    name: 'console',
    level: options.level || 'info',
    write: (entry: any) => {
      const redacted = redactor.redact(entry);
      const formatted = formatter.format(redacted);

      if (['fatal', 'error'].includes(entry.level)) {
        console.error(formatted);
      } else if (entry.level === 'warn') {
        console.warn(formatted);
      } else if (entry.level === 'debug' || entry.level === 'trace') {
        console.debug(formatted);
      } else {
        console.log(formatted);
      }
    },
  };

  return createLogger({
    ...options,
    transports: [consoleTransport],
  });
}

/**
 * Create a silent logger (for testing or disabled logging)
 */
export function createSilentLogger(name: string = 'silent') {
  return {
    fatal: () => {},
    error: () => {},
    warn: () => {},
    info: () => {},
    debug: () => {},
    trace: () => {},
    child: () => createSilentLogger(name),
    startTimer: () => () => 0,
    getLevel: () => 'fatal' as LogLevelType,
    setLevel: () => {},
    isLevelEnabled: () => false,
  };
}

/**
 * Check if we're in a browser environment
 */
export function isBrowser(): boolean {
  return typeof globalThis !== 'undefined' &&
    'window' in globalThis &&
    typeof (globalThis as any).window?.document !== 'undefined';
}

/**
 * Check if we're in a Node.js environment
 */
export function isNode(): boolean {
  return typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null;
}

/**
 * Check if we're in an Electron environment
 */
export function isElectron(): boolean {
  return typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.electron != null;
}

/**
 * Get the appropriate log path for the current environment
 */
export function getDefaultLogPath(appName: string = 'script-kit'): string | null {
  if (isBrowser()) {
    return null; // No file logging in browser
  }

  const os = require('node:os');
  const path = require('node:path');

  const platform = process.platform;

  switch (platform) {
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Logs', appName, 'app.log');
    case 'win32':
      return path.join(process.env.APPDATA || os.homedir(), appName, 'logs', 'app.log');
    default:
      return path.join(os.homedir(), '.config', appName, 'logs', 'app.log');
  }
}
