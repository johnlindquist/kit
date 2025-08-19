import ava from 'ava'
import { SourcemapErrorFormatter } from './sourcemap-formatter.js'
import os from 'os'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)

ava('formatError should parse basic error stack', (t) => {
  const error = new Error('Test error')
  error.stack = `Error: Test error
    at testFunction (/path/to/file.js:10:5)
    at Object.<anonymous> (/path/to/file.js:20:1)
    at Module._compile (node:internal/modules/cjs/loader:1000:10)`

  const result = SourcemapErrorFormatter.formatError(error)

  t.is(result.message, 'Test error')
  t.is(result.name, 'Error')
  t.is(result.frames.length, 3)
  t.is(result.frames[0].file, os.platform() === 'win32' ? '\\path\\to\\file.js' : '/path/to/file.js')
  t.is(result.frames[0].line, 10)
  t.is(result.frames[0].column, 5)
  t.is(result.frames[0].function, 'testFunction')
})

ava('formatError should handle file:// URLs', (t) => {
  const error = new Error('Test error')
  error.stack = `Error: Test error
    at file:///Users/test/script.js:5:10
    at file://C:/Users/test/script.js:10:20`

  const result = SourcemapErrorFormatter.formatError(error)

  t.is(result.frames.length, 2)
  
  // First frame - Unix style
  if (os.platform() === 'win32') {
    t.is(result.frames[0].file, '\\Users\\test\\script.js')
  } else {
    t.is(result.frames[0].file, '/Users/test/script.js')
  }
  
  // Second frame - Windows style
  if (os.platform() === 'win32') {
    t.is(result.frames[1].file, 'C:\\Users\\test\\script.js')
  } else {
    t.is(result.frames[1].file, 'C:/Users/test/script.js')
  }
})

ava('formatError should remove query parameters', (t) => {
  const error = new Error('Test error')
  error.stack = `Error: Test error
    at file:///path/to/file.js?uuid=12345:10:5`

  const result = SourcemapErrorFormatter.formatError(error)

  t.is(result.frames[0].file, os.platform() === 'win32' ? '\\path\\to\\file.js' : '/path/to/file.js')
  t.is(result.frames[0].line, 10)
  t.is(result.frames[0].column, 5)
})

ava('formatError should skip node_modules by default', (t) => {
  const error = new Error('Test error')
  error.stack = `Error: Test error
    at userFunction (/app/src/index.js:10:5)
    at moduleFunction (/app/node_modules/lodash/index.js:100:10)
    at internal/process (/internal/process/task_queues.js:95:5)
    at anotherUserFunction (/app/src/utils.js:20:15)`

  const result = SourcemapErrorFormatter.formatError(error)
  const formatted = result.stack.split('\n')

  // Should include error message and two user functions only
  t.is(formatted.length, 3)
  t.true(formatted[1].includes('userFunction'))
  t.true(formatted[2].includes('anotherUserFunction'))
  t.false(result.stack.includes('node_modules'))
  t.false(result.stack.includes('internal/process'))
})

ava('formatError should include all frames with KIT_ERROR_VERBOSE', (t) => {
  const originalVerbose = process.env.KIT_ERROR_VERBOSE
  process.env.KIT_ERROR_VERBOSE = 'true'

  const error = new Error('Test error')
  error.stack = `Error: Test error
    at userFunction (/app/src/index.js:10:5)
    at moduleFunction (/app/node_modules/lodash/index.js:100:10)`

  const result = SourcemapErrorFormatter.formatError(error)

  t.true(result.stack.includes('node_modules'))

  // Restore original value
  if (originalVerbose === undefined) {
    delete process.env.KIT_ERROR_VERBOSE
  } else {
    process.env.KIT_ERROR_VERBOSE = originalVerbose
  }
})

ava('extractErrorLocation should return first relevant frame', (t) => {
  const error = new Error('Test error')
  error.stack = `Error: Test error
    at internal/modules (/node:internal/modules/cjs/loader:1000:10)
    at userFunction (${__filename}:10:5)
    at anotherFunction (/nonexistent/file.js:20:15)`

  const location = SourcemapErrorFormatter.extractErrorLocation(error)

  t.not(location, null)
  t.is(location?.file, __filename)
  t.is(location?.line, 10)
  t.is(location?.column, 5)
})

ava('resolveFilePath should handle various path formats', (t) => {
  // Test absolute path
  const resolved = SourcemapErrorFormatter.resolveFilePath(__filename)
  t.is(resolved, __filename)

  // Test file:// URL
  const fileUrl = `file://${__filename}`
  const resolvedUrl = SourcemapErrorFormatter.resolveFilePath(fileUrl)
  t.is(resolvedUrl, __filename)

  // Test non-existent file
  const nonExistent = SourcemapErrorFormatter.resolveFilePath('/nonexistent/file.js')
  t.is(nonExistent, null)
})

ava('resolveFilePath should try TypeScript extensions', (t) => {
  // This test assumes the test file exists as .ts
  const jsPath = __filename.replace(/\.ts$/, '.js')
  const resolved = SourcemapErrorFormatter.resolveFilePath(jsPath)
  
  // Should find the .ts version
  t.is(resolved, __filename)
})