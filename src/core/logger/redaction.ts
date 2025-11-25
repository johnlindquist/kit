/**
 * Sensitive data redaction utilities
 *
 * Automatically removes or masks sensitive information from log entries
 * to prevent accidental exposure of credentials, PII, etc.
 */

/**
 * Configuration for the redactor
 */
export interface RedactionConfig {
  /** Field paths to redact (supports wildcards with *.) */
  paths: string[];
  /** Replacement string for redacted values */
  censor: string;
  /** Whether redaction is enabled */
  enabled: boolean;
}

/**
 * Default paths that should always be redacted
 */
export const DEFAULT_REDACTION_PATHS = [
  // Authentication
  'password',
  'passwd',
  'secret',
  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'apiKey',
  'api_key',
  'apiSecret',
  'api_secret',
  'authorization',
  'auth',
  'bearer',
  'jwt',

  // Session/Cookies
  'cookie',
  'cookies',
  'sessionId',
  'session_id',
  'sid',

  // Personal Information
  'ssn',
  'socialSecurity',
  'social_security',
  'creditCard',
  'credit_card',
  'cardNumber',
  'card_number',
  'cvv',
  'cvc',
  'pin',

  // Contact Info (optional, but good practice)
  'email',
  'phone',
  'phoneNumber',
  'phone_number',

  // Database
  'connectionString',
  'connection_string',
  'databaseUrl',
  'database_url',

  // Wildcards for nested objects
  '*.password',
  '*.secret',
  '*.token',
  '*.apiKey',
  '*.api_key',
  '*.authorization',
];

const DEFAULT_CONFIG: RedactionConfig = {
  paths: DEFAULT_REDACTION_PATHS,
  censor: '[REDACTED]',
  enabled: true,
};

/**
 * Create a redactor function with the given configuration
 */
export function createRedactor(config: Partial<RedactionConfig> = {}) {
  const finalConfig: RedactionConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    paths: [...DEFAULT_REDACTION_PATHS, ...(config.paths || [])],
  };

  // Pre-compile path matchers for performance
  const exactMatches = new Set<string>();
  const wildcardSuffixes: string[] = [];

  for (const path of finalConfig.paths) {
    const lowerPath = path.toLowerCase();
    if (lowerPath.startsWith('*.')) {
      wildcardSuffixes.push(lowerPath.slice(2));
    } else {
      exactMatches.add(lowerPath);
    }
  }

  /**
   * Check if a key should be redacted
   */
  function shouldRedact(key: string): boolean {
    if (!finalConfig.enabled) return false;

    const lowerKey = key.toLowerCase();

    // Check exact matches
    if (exactMatches.has(lowerKey)) return true;

    // Check wildcard matches
    for (const suffix of wildcardSuffixes) {
      if (lowerKey === suffix || lowerKey.endsWith(suffix)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a value looks like it might be sensitive
   * (heuristic-based detection for additional safety)
   */
  function looksLikeSensitive(key: string, value: unknown): boolean {
    if (typeof value !== 'string') return false;

    const lowerKey = key.toLowerCase();

    // Check for common patterns in values
    if (lowerKey.includes('key') || lowerKey.includes('secret')) {
      // If it looks like a key/secret and has typical key format
      if (/^[a-zA-Z0-9_-]{20,}$/.test(value)) return true;
    }

    // JWT pattern
    if (/^eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/.test(value)) {
      return true;
    }

    // Bearer token pattern
    if (/^Bearer\s+.+$/i.test(value)) return true;

    return false;
  }

  /**
   * Recursively redact sensitive values from an object
   */
  function redactValue(
    obj: unknown,
    visited = new WeakSet<object>()
  ): unknown {
    // Handle primitives
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;

    // Prevent circular reference issues
    if (visited.has(obj as object)) {
      return '[Circular]';
    }
    visited.add(obj as object);

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map((item) => redactValue(item, visited));
    }

    // Handle Date objects
    if (obj instanceof Date) {
      return obj.toISOString();
    }

    // Handle Error objects specially
    if (obj instanceof Error) {
      return {
        name: obj.name,
        message: redactValue(obj.message, visited) as string,
        stack: obj.stack,
        code: (obj as NodeJS.ErrnoException).code,
      };
    }

    // Handle plain objects
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (shouldRedact(key)) {
        result[key] = finalConfig.censor;
      } else if (typeof value === 'string' && looksLikeSensitive(key, value)) {
        // Additional heuristic check for values that look sensitive
        result[key] = finalConfig.censor;
      } else if (typeof value === 'object' && value !== null) {
        result[key] = redactValue(value, visited);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  return {
    /**
     * Redact sensitive values from an object
     */
    redact: <T>(obj: T): T => redactValue(obj) as T,

    /**
     * Check if a specific key would be redacted
     */
    shouldRedact,

    /**
     * Get the current configuration
     */
    getConfig: () => ({ ...finalConfig }),

    /**
     * Add additional paths to redact
     */
    addPaths: (paths: string[]) => {
      for (const path of paths) {
        const lowerPath = path.toLowerCase();
        if (lowerPath.startsWith('*.')) {
          wildcardSuffixes.push(lowerPath.slice(2));
        } else {
          exactMatches.add(lowerPath);
        }
        finalConfig.paths.push(path);
      }
    },
  };
}

// Default redactor instance
const defaultRedactor = createRedactor();

/**
 * Redact sensitive values using the default configuration
 */
export const redact = defaultRedactor.redact;

/**
 * Check if a key should be redacted using default configuration
 */
export const shouldRedact = defaultRedactor.shouldRedact;

/**
 * Redact a single string value if it matches sensitive patterns
 */
export function redactString(value: string, censor = '[REDACTED]'): string {
  // Check for common sensitive patterns

  // JWT
  if (/^eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/.test(value)) {
    return censor;
  }

  // Bearer token
  if (/^Bearer\s+.+$/i.test(value)) {
    return `Bearer ${censor}`;
  }

  // Basic auth header
  if (/^Basic\s+[a-zA-Z0-9+/=]+$/i.test(value)) {
    return `Basic ${censor}`;
  }

  // Connection strings with passwords
  if (/(:\/\/[^:]+:)[^@]+(@)/i.test(value)) {
    return value.replace(/(:\/\/[^:]+:)[^@]+(@)/i, `$1${censor}$2`);
  }

  return value;
}

/**
 * Mask a string, showing only first and last few characters
 */
export function maskString(
  value: string,
  options: { showFirst?: number; showLast?: number; maskChar?: string } = {}
): string {
  const { showFirst = 4, showLast = 4, maskChar = '*' } = options;

  if (value.length <= showFirst + showLast) {
    return maskChar.repeat(value.length);
  }

  const first = value.slice(0, showFirst);
  const last = value.slice(-showLast);
  const masked = maskChar.repeat(Math.min(value.length - showFirst - showLast, 8));

  return `${first}${masked}${last}`;
}
