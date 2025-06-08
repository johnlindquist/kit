# Kit SDK Testing Guidelines

## Overview

The Kit SDK uses AVA as its testing framework with TypeScript support. Tests are co-located with source code and follow specific naming conventions and patterns.

## Test File Conventions

### Naming
- TypeScript test files: `{module-name}.test.ts`
- JavaScript test files: `{module-name}.test.js`
- Benchmark tests: `{module-name}.benchmark.test.ts`
- Integration tests: `{module-name}-integration.test.ts`

### Location
Tests are placed in the same directory as the source code they test, not in a separate test directory.

## Running Tests

```bash
# Run all tests
pnpm ava

# Watch mode
pnpm ava:watch

# Debug tests
pnpm ava:debug

# Reset cache
pnpm ava:reset

# Type check only (no emit)
pnpm verify
```

## Creating a New Test

### 1. Import Dependencies

```typescript
import ava from 'ava'
// Import your module to test
import { functionToTest } from './module-to-test'
// Import necessary types and utilities
import type { YourTypes } from '../types'
```

### 2. Test Structure

```typescript
// Basic test
ava('test description', async (t) => {
  // Arrange
  const input = 'test input'
  
  // Act
  const result = await functionToTest(input)
  
  // Assert
  t.is(result, 'expected output')
})

// Test with setup/teardown
ava.beforeEach(async (t) => {
  // Setup code
  t.context.testData = { /* test data */ }
})

ava.afterEach.always(async (t) => {
  // Cleanup code
})
```

### 3. Common Assertions

```typescript
// Equality
t.is(actual, expected)
t.deepEqual(actual, expected)

// Truthiness
t.true(value)
t.false(value)
t.truthy(value)
t.falsy(value)

// Errors
await t.throwsAsync(asyncFunction, { instanceOf: Error, message: 'Expected error' })
await t.notThrowsAsync(asyncFunction)

// Logging
t.log('Debug information')

// Pass/Fail
t.pass('Test passed')
t.fail('Test failed')
```

## Test Patterns in Kit SDK

### 1. File System Tests
Many tests create temporary files. Use unique names to avoid conflicts:

```typescript
import { outputTmpFile } from '../api/kit'
import slugify from 'slugify'

ava('test with temp file', async (t) => {
  const name = 'Unique Test Name'
  const fileName = slugify(name, { lower: true })
  const content = 'test content'
  
  const filePath = await outputTmpFile(`${fileName}.ts`, content)
  
  // Test with the file
  // File is automatically cleaned up
})
```

### 2. Environment Setup
Tests often need to mock environment variables:

```typescript
// Save original values
const originalEnv = process.env.KENV

// Set test environment
process.env.KENV = '/test/path'
process.env.KIT_CONTEXT = 'workflow'

// Run test...

// Restore (in afterEach)
process.env.KENV = originalEnv
```

### 3. Mocking with Sinon
For complex mocking scenarios:

```typescript
import sinon from 'sinon'

ava.beforeEach(t => {
  const mockFunction = sinon.stub()
  mockFunction.resolves({ result: 'mocked' })
  
  t.context.mock = mockFunction
})

ava.afterEach.always(t => {
  sinon.restore()
})
```

### 4. Testing Async Generators
For streaming tests:

```typescript
async function* mockGenerator() {
  yield { type: 'text-delta', textDelta: 'chunk1' }
  yield { type: 'text-delta', textDelta: 'chunk2' }
  yield { type: 'finish', finishReason: 'stop' }
}

ava('stream test', async (t) => {
  let result = ''
  for await (const chunk of mockGenerator()) {
    if (chunk.type === 'text-delta') {
      result += chunk.textDelta
    }
  }
  t.is(result, 'chunk1chunk2')
})
```

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Descriptive Names**: Use clear, descriptive test names that explain what is being tested
3. **Co-location**: Place tests next to the code they test
4. **Unique Identifiers**: Use unique names for temp files and test data to avoid conflicts
5. **Cleanup**: Always clean up resources (files, mocks, etc.) in `afterEach.always`
6. **Type Safety**: Use TypeScript types for better test reliability
7. **Serial Tests**: Use `ava.serial` when tests must run in order or share state

## Common Test Categories in Kit SDK

- **Core**: Parser, format, utils, scriptlets (most heavily tested)
- **API**: npm, onepassword integrations
- **CLI**: Command-line interface functionality
- **Globals**: Custom global functions and utilities
- **Workers**: Background processing and caching
- **Setup**: Installation and configuration

## Debugging Tests

1. Use `t.log()` for debug output
2. Run specific test file: `pnpm ava src/core/utils.test.ts`
3. Use `ava.only` to run a single test
4. Check test config in `/test/ava.config.mjs`

## Platform-Specific Tests

Some tests are platform-specific:

```typescript
if (process.platform !== 'win32') {
  ava('unix-specific test', async (t) => {
    // Test code
  })
}
```

This ensures tests pass across all supported platforms.