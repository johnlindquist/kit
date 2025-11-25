# Script Kit Logger

Unified structured logging for the Script Kit ecosystem.

## Installation

The logger is part of the SDK and can be imported directly:

```typescript
import { createSDKLogger, quickLogger } from '@johnlindquist/kit/core/logger';
```

## Quick Start

### For Scripts

```typescript
import { createScriptLogger } from '@johnlindquist/kit/core/logger';

const log = createScriptLogger();

log.info('Script started');
log.debug('Processing item', { itemId: 123 });
log.error('Something failed', new Error('oops'), { context: 'cleanup' });
```

### For App Components

```typescript
import {
  initializeDomainLoggers,
  getCoreLogger
} from './logger';

// Initialize once at app startup
const loggers = initializeDomainLoggers();

// Get domain-specific loggers
const log = getCoreLogger();
log.info('App initialized');
```

### For Website/API

```typescript
import { createApiLogger } from '@/lib/logger';

const log = createApiLogger('scripts');
log.info('Script created', { scriptId: '123' });
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Minimum log level | `info` (prod), `debug` (dev) |
| `LOG_FORMAT` | Output format: `json`, `pretty`, `minimal` | `pretty` (dev), `json` (prod) |
| `LOG_COLORS` | Enable ANSI colors | `true` (TTY), `false` (non-TTY) |
| `LOG_FILE` | File path for file logging | (none) |
| `LOG_REDACT` | Enable sensitive data redaction | `true` |
| `LOG_REDACT_PATHS` | Additional paths to redact (comma-separated) | (none) |
| `NODE_ENV` | Environment (`production`, `development`, `test`) | `development` |
| `DEBUG` | Debug filter pattern | (none) |
| `VERBOSE` | Enable verbose (debug) logging | `false` |

### App-Specific Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KIT_LOG_LEVEL` | Log level for Script Kit | (uses LOG_LEVEL) |
| `KIT_LOG_TO_FILE` | Enable file logging | `true` |
| `KIT_HEALTH_CHECK_INTERVAL` | Health check interval in seconds | `120` |
| `KIT_PROCESS_SCAN_INTERVAL` | Process scan interval in minutes | `5` |

## Log Levels

From most to least severe:

| Level | Description | Use Case |
|-------|-------------|----------|
| `fatal` | System is unusable | Unrecoverable errors, crash scenarios |
| `error` | Error conditions | Exceptions, failed operations |
| `warn` | Warning conditions | Deprecations, recoverable issues |
| `info` | Informational | Normal operations, user actions |
| `debug` | Debug information | Detailed flow, variable values |
| `trace` | Trace/verbose | Very detailed, high-frequency events |

## Features

### Structured Logging

All logs are structured with consistent fields:

```typescript
log.info('User logged in', {
  userId: 'u123',
  method: 'github',
  responseTime: 150,
});
// Output (JSON format):
// {"level":"info","time":"2025-01-15T10:30:00Z","msg":"User logged in","userId":"u123","method":"github","responseTime":150}
```

### Correlation IDs

Track requests across async operations:

```typescript
import { withCorrelationAsync, getCorrelationId } from '@johnlindquist/kit/core/logger';

await withCorrelationAsync(async () => {
  log.info('Starting operation'); // Includes correlationId
  await doSomething();
  log.info('Operation complete'); // Same correlationId
});
```

### Sensitive Data Redaction

Automatically redacts sensitive fields:

```typescript
log.info('User data', {
  username: 'john',
  password: 'secret123', // Becomes "[REDACTED]"
  apiKey: 'sk-12345',    // Becomes "[REDACTED]"
});
```

Redacted paths include:
- `password`, `secret`, `token`, `apiKey`, `api_key`
- `authorization`, `cookie`, `accessToken`, `refreshToken`
- `creditCard`, `ssn`, `email`

### Child Loggers

Create contextual child loggers:

```typescript
const log = createSDKLogger({ name: 'scripts' });
const scriptLog = log.child({ scriptId: 'abc123' });

scriptLog.info('Processing'); // Includes scriptId in all logs
```

### Performance Timing

```typescript
const endTimer = log.startTimer('database-query');
await db.query('SELECT ...');
const duration = endTimer();
// Logs: "database-query completed" with duration
```

### Error Aggregation

Track and summarize errors:

```typescript
import { getErrorAggregator } from '@johnlindquist/kit/core/logger';

const aggregator = getErrorAggregator();

try {
  await riskyOperation();
} catch (error) {
  aggregator.record(error, { operation: 'risky' });
}

// Get summary
const summary = aggregator.getSummary();
console.log(`Total errors: ${summary.totalErrors}`);
console.log(`Top error: ${summary.topErrors[0]?.message}`);
```

## Domain Loggers (App)

The app consolidates 35+ category loggers into 8 domains:

| Domain | Categories |
|--------|------------|
| `core` | main, kit, system, health |
| `window` | window, prompt, widget, theme |
| `process` | process, script, child, spawn |
| `input` | input, keyboard, actions, shortcut |
| `communication` | ipc, channel, messages, sync |
| `scheduling` | schedule, cron, watch, clipboard |
| `terminal` | terminal, pty |
| `diagnostic` | debug, log, performance |

Usage:

```typescript
import { getCoreLogger, getProcessLogger } from './logger';

getCoreLogger().info('System started');
getProcessLogger().debug('Script spawned', { pid: 1234 });
```

## Log Rotation

File logs are automatically rotated:

- Max size: 10MB per file
- Max files: 5 (oldest deleted)
- Compression: gzip for rotated files

Configuration:

```typescript
import { createRotatingStream } from '@johnlindquist/kit/core/logger';

const stream = createRotatingStream('/path/to/app.log', {
  maxSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  compress: true,
});
```

## Formatters

### JSON Format
Best for production, log aggregation:
```json
{"level":"info","time":"2025-01-15T10:30:00Z","name":"api","msg":"Request completed","path":"/api/scripts","responseTime":45}
```

### Pretty Format
Best for development:
```
10:30:00.123 INFO  [api] Request completed path=/api/scripts responseTime=45
```

### Minimal Format
Best for tests:
```
[INFO] Request completed
```

## Migration Guide

### From Old Category Loggers

```typescript
// Before
import { scriptLog, processLog } from './logs';
scriptLog.info('...');
processLog.debug('...');

// After
import { getProcessLogger } from './logger';
const log = getProcessLogger();
log.info('...'); // Covers both script and process
```

### From console.log

```typescript
// Before
console.log('User logged in:', userId);
console.error('Error:', error);

// After
import { createSDKLogger } from '@johnlindquist/kit/core/logger';
const log = createSDKLogger({ name: 'auth' });
log.info('User logged in', { userId });
log.error('Error', error);
```

## Best Practices

1. **Use structured data**: Pass objects, not string interpolation
   ```typescript
   // Good
   log.info('User created', { userId, email });

   // Avoid
   log.info(`User ${userId} created with email ${email}`);
   ```

2. **Use appropriate levels**: Debug for development, info for production
3. **Include context**: Add relevant IDs and metadata
4. **Use child loggers**: For request/operation-scoped logging
5. **Don't log sensitive data**: Use redaction for safety
6. **Use correlation IDs**: For distributed tracing

## Troubleshooting

### Logs not appearing
- Check `LOG_LEVEL` is set correctly
- Verify TTY for colored output
- Check if redaction is hiding content

### Log files not rotating
- Check file permissions
- Verify disk space
- Check `LOG_FILE` path is writable

### Performance issues
- Use appropriate log levels
- Avoid logging in hot paths
- Consider sampling for high-frequency events
