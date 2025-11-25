/**
 * Correlation ID tracking for distributed tracing
 *
 * Provides context propagation across async operations using AsyncLocalStorage.
 * This allows correlation IDs to be automatically included in all log entries
 * within a given operation context.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

/**
 * Correlation context that flows through async operations
 */
export interface CorrelationContext {
  /** Unique correlation ID for the request/operation */
  correlationId: string;
  /** Parent correlation ID for nested operations */
  parentId?: string;
  /** When the context was created */
  startTime: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * AsyncLocalStorage instance for correlation context
 */
const correlationStorage = new AsyncLocalStorage<CorrelationContext>();

/**
 * Generate a new correlation ID
 * Uses crypto.randomUUID for cryptographically secure IDs
 */
export function generateCorrelationId(): string {
  return randomUUID();
}

/**
 * Generate a short correlation ID (first 8 characters)
 * Useful for display purposes while maintaining uniqueness for most use cases
 */
export function generateShortCorrelationId(): string {
  return randomUUID().slice(0, 8);
}

/**
 * Get the current correlation context from AsyncLocalStorage
 * Returns undefined if no context is set
 */
export function getCorrelationContext(): CorrelationContext | undefined {
  return correlationStorage.getStore();
}

/**
 * Get the current correlation ID, or undefined if not in a correlation context
 */
export function getCorrelationId(): string | undefined {
  return correlationStorage.getStore()?.correlationId;
}

/**
 * Get the parent correlation ID, if this is a nested context
 */
export function getParentId(): string | undefined {
  return correlationStorage.getStore()?.parentId;
}

/**
 * Get metadata from the current correlation context
 */
export function getCorrelationMetadata(): Record<string, unknown> | undefined {
  return correlationStorage.getStore()?.metadata;
}

/**
 * Run a synchronous function within a correlation context
 *
 * @example
 * ```ts
 * withCorrelation(() => {
 *   logger.info('Processing request');
 *   // Correlation ID is automatically included
 * });
 * ```
 */
export function withCorrelation<T>(
  fn: () => T,
  options: {
    correlationId?: string;
    parentId?: string;
    metadata?: Record<string, unknown>;
  } = {}
): T {
  const parentContext = getCorrelationContext();

  const context: CorrelationContext = {
    correlationId: options.correlationId ?? generateCorrelationId(),
    parentId: options.parentId ?? parentContext?.correlationId,
    startTime: Date.now(),
    metadata: options.metadata,
  };

  return correlationStorage.run(context, fn);
}

/**
 * Run an async function within a correlation context
 *
 * @example
 * ```ts
 * await withCorrelationAsync(async () => {
 *   logger.info('Starting async operation');
 *   await someAsyncWork();
 *   logger.info('Completed'); // Same correlation ID
 * });
 * ```
 */
export async function withCorrelationAsync<T>(
  fn: () => Promise<T>,
  options: {
    correlationId?: string;
    parentId?: string;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<T> {
  const parentContext = getCorrelationContext();

  const context: CorrelationContext = {
    correlationId: options.correlationId ?? generateCorrelationId(),
    parentId: options.parentId ?? parentContext?.correlationId,
    startTime: Date.now(),
    metadata: options.metadata,
  };

  return correlationStorage.run(context, fn);
}

/**
 * Create a child correlation context
 * The new context has a new correlation ID but links to the parent
 */
export function createChildContext(
  metadata?: Record<string, unknown>
): CorrelationContext {
  const parentContext = getCorrelationContext();

  return {
    correlationId: generateCorrelationId(),
    parentId: parentContext?.correlationId,
    startTime: Date.now(),
    metadata: { ...parentContext?.metadata, ...metadata },
  };
}

/**
 * Run a function with a child correlation context
 * Useful for sub-operations that should be traceable back to parent
 */
export function withChildCorrelation<T>(
  fn: () => T,
  metadata?: Record<string, unknown>
): T {
  const childContext = createChildContext(metadata);
  return correlationStorage.run(childContext, fn);
}

/**
 * Async version of withChildCorrelation
 */
export async function withChildCorrelationAsync<T>(
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const childContext = createChildContext(metadata);
  return correlationStorage.run(childContext, fn);
}

/**
 * Add metadata to the current correlation context
 * Returns false if no context exists
 */
export function addCorrelationMetadata(
  metadata: Record<string, unknown>
): boolean {
  const context = getCorrelationContext();
  if (!context) return false;

  context.metadata = { ...context.metadata, ...metadata };
  return true;
}

/**
 * Calculate elapsed time since context was created
 * Returns undefined if no context exists
 */
export function getElapsedTime(): number | undefined {
  const context = getCorrelationContext();
  if (!context) return undefined;
  return Date.now() - context.startTime;
}

/**
 * Extract correlation headers for HTTP requests
 * Standard headers used for distributed tracing
 */
export function getCorrelationHeaders(): Record<string, string> {
  const context = getCorrelationContext();
  if (!context) return {};

  const headers: Record<string, string> = {
    'x-correlation-id': context.correlationId,
  };

  if (context.parentId) {
    headers['x-parent-id'] = context.parentId;
  }

  return headers;
}

/**
 * Create correlation context from incoming HTTP headers
 */
export function correlationContextFromHeaders(
  headers: Record<string, string | string[] | undefined>
): Partial<CorrelationContext> {
  const getHeader = (name: string): string | undefined => {
    const value = headers[name] ?? headers[name.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
  };

  return {
    correlationId: getHeader('x-correlation-id') ?? getHeader('X-Correlation-ID'),
    parentId: getHeader('x-parent-id') ?? getHeader('X-Parent-ID'),
  };
}

/**
 * Middleware-style wrapper for Express/Koa/etc
 * Creates a correlation context for each request
 */
export function correlationMiddleware<Req extends { headers: Record<string, any> }, Res, Next extends () => void | Promise<void>>(
  req: Req,
  _res: Res,
  next: Next
): void {
  const fromHeaders = correlationContextFromHeaders(req.headers);

  withCorrelation(
    () => next(),
    {
      correlationId: fromHeaders.correlationId,
      parentId: fromHeaders.parentId,
    }
  );
}

/**
 * Decorator for class methods to run in correlation context
 * Note: Requires experimentalDecorators in TypeScript
 */
export function withCorrelationContext() {
  return function (
    _target: object,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      return withCorrelation(() => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

/**
 * Bind correlation context to a callback
 * Useful for callbacks that may be called outside the current context
 */
export function bindCorrelationContext<T extends (...args: any[]) => any>(
  fn: T
): T {
  const context = getCorrelationContext();
  if (!context) return fn;

  return ((...args: Parameters<T>) => {
    return correlationStorage.run(context, () => fn(...args));
  }) as T;
}

/**
 * Export the storage for advanced use cases
 */
export { correlationStorage };
