/**
 * Error Aggregator
 *
 * Utility for aggregating and summarizing errors over time.
 * Helps identify recurring issues and provides statistics.
 */

import type { LogEntry, LogLevel, LogContext } from './types';

/**
 * Error bucket for grouping similar errors
 */
interface ErrorBucket {
  /** First occurrence timestamp */
  firstSeen: string;
  /** Last occurrence timestamp */
  lastSeen: string;
  /** Total count of this error */
  count: number;
  /** Sample error message */
  message: string;
  /** Sample error stack */
  stack?: string;
  /** Error name/type */
  name: string;
  /** Sample context from first occurrence */
  sampleContext?: LogContext;
  /** Unique contexts where this error occurred */
  components: Set<string>;
}

/**
 * Aggregated error summary
 */
export interface ErrorSummary {
  /** Total error count in the period */
  totalErrors: number;
  /** Unique error types */
  uniqueErrors: number;
  /** Time window start */
  windowStart: string;
  /** Time window end */
  windowEnd: string;
  /** Top errors by frequency */
  topErrors: Array<{
    key: string;
    count: number;
    message: string;
    name: string;
    firstSeen: string;
    lastSeen: string;
    components: string[];
  }>;
  /** Error counts by component */
  byComponent: Record<string, number>;
  /** Error counts by error type */
  byType: Record<string, number>;
}

/**
 * Error aggregator configuration
 */
export interface ErrorAggregatorConfig {
  /** Maximum number of unique errors to track (default: 1000) */
  maxBuckets?: number;
  /** Window size in milliseconds for cleanup (default: 1 hour) */
  windowMs?: number;
  /** Number of top errors to include in summary (default: 10) */
  topN?: number;
}

/**
 * Generate a fingerprint for an error to group similar errors
 */
function generateErrorFingerprint(error: {
  name?: string;
  message?: string;
  stack?: string;
  code?: string;
}): string {
  const parts: string[] = [];

  // Include error name
  if (error.name) {
    parts.push(error.name);
  }

  // Include error code if present
  if (error.code) {
    parts.push(error.code);
  }

  // Normalize the message - remove specific values like paths, IDs
  if (error.message) {
    let normalizedMessage = error.message
      // Remove file paths
      .replace(/(?:\/[\w.-]+)+/g, '<PATH>')
      // Remove Windows paths
      .replace(/(?:[A-Z]:)?(?:\\[\w.-]+)+/gi, '<PATH>')
      // Remove UUIDs
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<UUID>')
      // Remove numbers
      .replace(/\b\d+\b/g, '<N>')
      // Remove quoted strings (but keep structure)
      .replace(/"[^"]*"/g, '"<STR>"')
      .replace(/'[^']*'/g, "'<STR>'")
      // Collapse whitespace
      .replace(/\s+/g, ' ')
      .trim();

    parts.push(normalizedMessage);
  }

  // Include first line of stack trace (the error location)
  if (error.stack) {
    const stackLines = error.stack.split('\n');
    // Skip the first line (error message) and get the location
    for (const line of stackLines.slice(1)) {
      const trimmed = line.trim();
      if (trimmed.startsWith('at ')) {
        // Normalize the location
        const normalized = trimmed
          .replace(/(?:\/[\w.-]+)+/g, '<PATH>')
          .replace(/(?:[A-Z]:)?(?:\\[\w.-]+)+/gi, '<PATH>')
          .replace(/:\d+:\d+/g, ':<L>:<C>');
        parts.push(normalized);
        break;
      }
    }
  }

  return parts.join('|');
}

/**
 * Error Aggregator class
 */
export class ErrorAggregator {
  private buckets: Map<string, ErrorBucket> = new Map();
  private config: Required<ErrorAggregatorConfig>;
  private windowStart: Date;

  constructor(config: ErrorAggregatorConfig = {}) {
    this.config = {
      maxBuckets: config.maxBuckets ?? 1000,
      windowMs: config.windowMs ?? 60 * 60 * 1000, // 1 hour
      topN: config.topN ?? 10,
    };
    this.windowStart = new Date();
  }

  /**
   * Record an error from a log entry
   */
  recordFromLogEntry(entry: LogEntry): void {
    if (!entry.error) return;

    const fingerprint = generateErrorFingerprint(entry.error);
    const now = new Date().toISOString();
    const component = entry.context?.component as string || 'unknown';

    const existing = this.buckets.get(fingerprint);

    if (existing) {
      existing.lastSeen = now;
      existing.count++;
      existing.components.add(component);
    } else {
      // Check if we need to evict old entries
      if (this.buckets.size >= this.config.maxBuckets) {
        this.evictOldest();
      }

      this.buckets.set(fingerprint, {
        firstSeen: now,
        lastSeen: now,
        count: 1,
        message: entry.error.message || 'Unknown error',
        stack: entry.error.stack,
        name: entry.error.name || 'Error',
        sampleContext: entry.context,
        components: new Set([component]),
      });
    }
  }

  /**
   * Record an error directly
   */
  record(
    error: Error,
    context?: LogContext
  ): void {
    const entry: LogEntry = {
      level: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
      context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as NodeJS.ErrnoException).code,
      },
    };

    this.recordFromLogEntry(entry);
  }

  /**
   * Get aggregated summary
   */
  getSummary(): ErrorSummary {
    const now = new Date();
    const bucketArray = Array.from(this.buckets.entries());

    // Calculate totals
    let totalErrors = 0;
    const byComponent: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const [, bucket] of bucketArray) {
      totalErrors += bucket.count;

      // Count by type
      byType[bucket.name] = (byType[bucket.name] || 0) + bucket.count;

      // Count by component
      for (const component of bucket.components) {
        byComponent[component] = (byComponent[component] || 0) + bucket.count;
      }
    }

    // Sort by count and get top N
    const topErrors = bucketArray
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, this.config.topN)
      .map(([key, bucket]) => ({
        key,
        count: bucket.count,
        message: bucket.message,
        name: bucket.name,
        firstSeen: bucket.firstSeen,
        lastSeen: bucket.lastSeen,
        components: Array.from(bucket.components),
      }));

    return {
      totalErrors,
      uniqueErrors: this.buckets.size,
      windowStart: this.windowStart.toISOString(),
      windowEnd: now.toISOString(),
      topErrors,
      byComponent,
      byType,
    };
  }

  /**
   * Clear all buckets and reset window
   */
  reset(): void {
    this.buckets.clear();
    this.windowStart = new Date();
  }

  /**
   * Cleanup old entries outside the time window
   */
  cleanup(): number {
    const cutoff = new Date(Date.now() - this.config.windowMs);
    let removed = 0;

    for (const [key, bucket] of this.buckets.entries()) {
      if (new Date(bucket.lastSeen) < cutoff) {
        this.buckets.delete(key);
        removed++;
      }
    }

    // Reset window start if we cleaned up
    if (removed > 0 && this.buckets.size === 0) {
      this.windowStart = new Date();
    }

    return removed;
  }

  /**
   * Get the count of a specific error type
   */
  getErrorCount(errorName: string): number {
    let count = 0;
    for (const bucket of this.buckets.values()) {
      if (bucket.name === errorName) {
        count += bucket.count;
      }
    }
    return count;
  }

  /**
   * Check if an error is recurring (seen multiple times)
   */
  isRecurring(error: Error, threshold = 3): boolean {
    const fingerprint = generateErrorFingerprint({
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    const bucket = this.buckets.get(fingerprint);
    return bucket ? bucket.count >= threshold : false;
  }

  /**
   * Evict the oldest bucket when at capacity
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, bucket] of this.buckets.entries()) {
      const time = new Date(bucket.lastSeen).getTime();
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.buckets.delete(oldestKey);
    }
  }
}

/**
 * Create an error aggregator
 */
export function createErrorAggregator(
  config?: ErrorAggregatorConfig
): ErrorAggregator {
  return new ErrorAggregator(config);
}

/**
 * Global error aggregator instance
 */
let globalAggregator: ErrorAggregator | null = null;

/**
 * Get or create the global error aggregator
 */
export function getErrorAggregator(): ErrorAggregator {
  if (!globalAggregator) {
    globalAggregator = createErrorAggregator();
  }
  return globalAggregator;
}

/**
 * Set the global error aggregator
 */
export function setErrorAggregator(aggregator: ErrorAggregator): void {
  globalAggregator = aggregator;
}
