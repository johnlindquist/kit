/**
 * Logger configuration management
 *
 * Provides environment-based configuration for logging across
 * all Script Kit applications (app, SDK, site).
 */

import type { LogLevel, LoggerOptions } from './types';
import type { RotationConfig } from './rotation';
import type { RedactionConfig } from './redaction';

/**
 * Environment variables for logger configuration
 */
export interface LogEnvVars {
  /** Log level override */
  LOG_LEVEL?: string;
  /** Output format: 'json' | 'pretty' | 'minimal' */
  LOG_FORMAT?: string;
  /** Enable/disable colors in output */
  LOG_COLORS?: string;
  /** Log file path */
  LOG_FILE?: string;
  /** Enable/disable redaction */
  LOG_REDACT?: string;
  /** Additional paths to redact (comma-separated) */
  LOG_REDACT_PATHS?: string;
  /** Node environment */
  NODE_ENV?: string;
  /** Debug filter pattern */
  DEBUG?: string;
  /** Enable verbose logging */
  VERBOSE?: string;
}

/**
 * Complete logger configuration
 */
export interface LoggerConfig {
  /** Minimum log level */
  level: LogLevel;
  /** Output format */
  format: 'json' | 'pretty' | 'minimal' | 'file';
  /** Whether to use colors */
  colors: boolean;
  /** Whether this is production environment */
  isProduction: boolean;
  /** Whether to output structured JSON */
  structured: boolean;
  /** File output path (if file logging enabled) */
  filePath?: string;
  /** Rotation configuration */
  rotation: Partial<RotationConfig>;
  /** Redaction configuration */
  redaction: Partial<RedactionConfig>;
  /** Default context to include in all logs */
  defaultContext: Record<string, unknown>;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: LoggerConfig = {
  level: 'info',
  format: 'pretty',
  colors: true,
  isProduction: false,
  structured: false,
  rotation: {
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    compress: true,
  },
  redaction: {
    enabled: true,
  },
  defaultContext: {},
};

/**
 * Parse a string to LogLevel, with fallback
 */
export function parseLogLevel(value: string | undefined, fallback: LogLevel = 'info'): LogLevel {
  if (!value) return fallback;

  const normalized = value.toLowerCase().trim();
  const validLevels: LogLevel[] = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];

  if (validLevels.includes(normalized as LogLevel)) {
    return normalized as LogLevel;
  }

  // Handle common aliases
  switch (normalized) {
    case 'warning':
      return 'warn';
    case 'verbose':
      return 'debug';
    case 'silly':
    case 'all':
      return 'trace';
    case 'silent':
    case 'none':
      return 'fatal';
    default:
      return fallback;
  }
}

/**
 * Parse boolean from environment variable
 */
export function parseBoolean(value: string | undefined, fallback: boolean = false): boolean {
  if (value === undefined) return fallback;

  const normalized = value.toLowerCase().trim();
  return ['true', '1', 'yes', 'on', 'enabled'].includes(normalized);
}

/**
 * Load logger configuration from environment variables
 */
export function loadConfigFromEnv(env: Partial<LogEnvVars> = process.env as unknown as Partial<LogEnvVars>): LoggerConfig {
  const isProduction = env.NODE_ENV === 'production';
  const isVerbose = parseBoolean(env.VERBOSE);

  // Determine log level
  let level: LogLevel = 'info';
  if (env.LOG_LEVEL) {
    level = parseLogLevel(env.LOG_LEVEL);
  } else if (isVerbose) {
    level = 'debug';
  } else if (env.DEBUG) {
    level = 'debug';
  }

  // Determine format
  let format: 'json' | 'pretty' | 'minimal' | 'file' = 'pretty';
  if (env.LOG_FORMAT) {
    const normalized = env.LOG_FORMAT.toLowerCase().trim();
    if (['json', 'pretty', 'minimal', 'file'].includes(normalized)) {
      format = normalized as typeof format;
    }
  } else if (isProduction) {
    format = 'json';
  }

  // Determine colors
  const colors = env.LOG_COLORS !== undefined
    ? parseBoolean(env.LOG_COLORS)
    : !isProduction && process.stdout?.isTTY;

  // Parse redaction paths
  const additionalRedactPaths = env.LOG_REDACT_PATHS
    ? env.LOG_REDACT_PATHS.split(',').map(p => p.trim()).filter(Boolean)
    : [];

  return {
    level,
    format,
    colors,
    isProduction,
    structured: format === 'json' || isProduction,
    filePath: env.LOG_FILE,
    rotation: {
      maxSize: 10 * 1024 * 1024,
      maxFiles: 5,
      compress: true,
    },
    redaction: {
      enabled: env.LOG_REDACT !== undefined ? parseBoolean(env.LOG_REDACT, true) : true,
      paths: additionalRedactPaths,
    },
    defaultContext: {
      env: env.NODE_ENV || 'development',
    },
  };
}

/**
 * Create logger options from configuration
 */
export function createLoggerOptionsFromConfig(
  name: string,
  config: Partial<LoggerConfig> = {}
): LoggerOptions {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return {
    name,
    level: finalConfig.level,
    structured: finalConfig.structured,
    defaultContext: finalConfig.defaultContext,
    redaction: finalConfig.redaction,
  };
}

/**
 * Get configuration for different environments
 */
export function getEnvironmentConfig(environment: 'development' | 'production' | 'test'): Partial<LoggerConfig> {
  switch (environment) {
    case 'production':
      return {
        level: 'info',
        format: 'json',
        colors: false,
        isProduction: true,
        structured: true,
        redaction: { enabled: true },
      };

    case 'test':
      return {
        level: 'warn', // Less noise during tests
        format: 'minimal',
        colors: false,
        isProduction: false,
        structured: false,
        redaction: { enabled: true },
      };

    case 'development':
    default:
      return {
        level: 'debug',
        format: 'pretty',
        colors: true,
        isProduction: false,
        structured: false,
        redaction: { enabled: true },
      };
  }
}

/**
 * Configuration for specific Script Kit components
 */
export const COMPONENT_CONFIGS: Record<string, Partial<LoggerConfig>> = {
  // Electron main process
  main: {
    defaultContext: { component: 'main' },
  },

  // Electron renderer process
  renderer: {
    defaultContext: { component: 'renderer' },
  },

  // SDK/Core
  sdk: {
    level: 'info',
    defaultContext: { component: 'sdk' },
  },

  // Website
  site: {
    structured: true,
    defaultContext: { component: 'site' },
  },

  // IPC communication
  ipc: {
    level: 'debug',
    defaultContext: { component: 'ipc' },
  },

  // Process management
  process: {
    defaultContext: { component: 'process' },
  },

  // Script execution
  script: {
    defaultContext: { component: 'script' },
  },

  // Window management
  window: {
    defaultContext: { component: 'window' },
  },
};

/**
 * Get configuration for a specific component
 */
export function getComponentConfig(componentName: string): Partial<LoggerConfig> {
  return COMPONENT_CONFIGS[componentName] || {
    defaultContext: { component: componentName },
  };
}

/**
 * Merge multiple configurations (later ones override earlier)
 */
export function mergeConfigs(...configs: Array<Partial<LoggerConfig>>): LoggerConfig {
  const result = { ...DEFAULT_CONFIG };

  for (const config of configs) {
    if (config.level !== undefined) result.level = config.level;
    if (config.format !== undefined) result.format = config.format;
    if (config.colors !== undefined) result.colors = config.colors;
    if (config.isProduction !== undefined) result.isProduction = config.isProduction;
    if (config.structured !== undefined) result.structured = config.structured;
    if (config.filePath !== undefined) result.filePath = config.filePath;

    if (config.rotation) {
      result.rotation = { ...result.rotation, ...config.rotation };
    }

    if (config.redaction) {
      result.redaction = { ...result.redaction, ...config.redaction };
    }

    if (config.defaultContext) {
      result.defaultContext = { ...result.defaultContext, ...config.defaultContext };
    }
  }

  return result;
}

/**
 * Validate a logger configuration
 */
export function validateConfig(config: Partial<LoggerConfig>): string[] {
  const errors: string[] = [];

  if (config.level) {
    const validLevels: LogLevel[] = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];
    if (!validLevels.includes(config.level)) {
      errors.push(`Invalid log level: ${config.level}`);
    }
  }

  if (config.format) {
    const validFormats = ['json', 'pretty', 'minimal', 'file'];
    if (!validFormats.includes(config.format)) {
      errors.push(`Invalid log format: ${config.format}`);
    }
  }

  if (config.rotation) {
    if (config.rotation.maxSize !== undefined && config.rotation.maxSize < 1024) {
      errors.push('Rotation maxSize must be at least 1024 bytes');
    }
    if (config.rotation.maxFiles !== undefined && config.rotation.maxFiles < 1) {
      errors.push('Rotation maxFiles must be at least 1');
    }
  }

  return errors;
}
