import ava from 'ava'
import {
  parseMetadataComments,
  parseSnippetMetadata,
  VALID_METADATA_KEYS_SET,
  VALID_METADATA_KEYS
} from './metadata-parser.js'

// Test basic metadata parsing
ava('parseMetadataComments - parses basic comment metadata', (t) => {
  const content = `
// Name: Test Script
// Description: A test script
// Shortcut: cmd+shift+t
`.trim()

  const { metadata, warnings } = parseMetadataComments(content)

  t.is(metadata.name, 'Test Script')
  t.is(metadata.description, 'A test script')
  t.is(metadata.shortcut, 'cmd+shift+t')
  t.is(warnings.length, 0)
})

// Test hash-style comments
ava('parseMetadataComments - parses hash-style comments', (t) => {
  const content = `
# Name: Python Script
# Description: A Python script
`.trim()

  const { metadata, warnings } = parseMetadataComments(content)

  t.is(metadata.name, 'Python Script')
  t.is(metadata.description, 'A Python script')
  t.is(warnings.length, 0)
})

// Test boolean parsing
ava('parseMetadataComments - parses boolean values', (t) => {
  const content = `
// Background: true
// LongRunning: false
`.trim()

  const { metadata } = parseMetadataComments(content)

  t.is(metadata.background, true)
  t.is(metadata.longRunning, false)
})

// Test number parsing
ava('parseMetadataComments - parses timeout as number', (t) => {
  const content = `
// Timeout: 5000
// Index: 10
`.trim()

  const { metadata } = parseMetadataComments(content)

  t.is(metadata.timeout, 5000)
  t.is(metadata.index, 10)
})

// Test validation warnings for unknown keys
ava('parseMetadataComments - warns on unknown keys', (t) => {
  const content = `
// Name: Test Script
// UnknownKey: some value
// AnotherBadKey: another value
`.trim()

  const { metadata, warnings, raw } = parseMetadataComments(content)

  t.is(metadata.name, 'Test Script')
  t.is(warnings.length, 2)
  t.is(warnings[0].key, 'unknownKey')
  t.true(warnings[0].message.includes('Unknown metadata key'))
  // Raw should contain the invalid keys
  t.is(raw.unknownKey, 'some value')
  t.is(raw.anotherBadKey, 'another value')
})

// Test typo suggestions
ava('parseMetadataComments - suggests corrections for typos', (t) => {
  const content = `
// Shotcut: cmd+t
`.trim()

  const { warnings } = parseMetadataComments(content)

  t.is(warnings.length, 1)
  t.is(warnings[0].key, 'shotcut')
  t.truthy(warnings[0].suggestion)
  t.true(warnings[0].suggestion?.includes('shortcut'))
})

// Test ignoring URLs
ava('parseMetadataComments - ignores URLs in comments', (t) => {
  const content = `
// Name: Test Script
// See https://example.com for more info
// API docs: http://api.example.com
`.trim()

  const { metadata, warnings } = parseMetadataComments(content)

  t.is(metadata.name, 'Test Script')
  // Should not create warnings for URL-like keys
  t.is(warnings.length, 0)
})

// Test ignoring TODO/FIXME
ava('parseMetadataComments - ignores TODO/FIXME comments', (t) => {
  const content = `
// Name: Test Script
// TODO: Fix this later
// FIXME: This is broken
// NOTE: Important info
`.trim()

  const { metadata, warnings } = parseMetadataComments(content)

  t.is(metadata.name, 'Test Script')
  t.is(warnings.length, 0)
})

// Test multiline comment skipping
ava('parseMetadataComments - skips multiline comments', (t) => {
  const content = `
// Name: Test Script
/* This is a multiline
comment that should be
skipped entirely */
// Description: After multiline
`.trim()

  const { metadata, warnings } = parseMetadataComments(content)

  t.is(metadata.name, 'Test Script')
  t.is(metadata.description, 'After multiline')
  t.is(warnings.length, 0)
})

// Test first value wins
ava('parseMetadataComments - first value wins for duplicate keys', (t) => {
  const content = `
// Name: First Name
// Name: Second Name
`.trim()

  const { metadata } = parseMetadataComments(content)

  t.is(metadata.name, 'First Name')
})

// Test case normalization
ava('parseMetadataComments - normalizes key case', (t) => {
  const content = `
// NAME: Test
// ShortCut: cmd+t
// BACKGROUND: true
`.trim()

  const { metadata } = parseMetadataComments(content)

  // Keys should be normalized to camelCase
  t.is(metadata.name, 'Test')
  t.is(metadata.shortcut, 'cmd+t')
  t.is(metadata.background, true)
})

// Test validation disabled
ava('parseMetadataComments - allows unknown keys when validation disabled', (t) => {
  const content = `
// CustomKey: custom value
// Name: Test
`.trim()

  const { metadata, warnings, raw } = parseMetadataComments(content, { validate: false })

  // With validation disabled, unknown keys go to metadata
  t.is(warnings.length, 0)
  t.is((metadata as any).customKey, 'custom value')
  t.is(metadata.name, 'Test')
})

// Test maxLines option
ava('parseMetadataComments - respects maxLines option', (t) => {
  const content = `
// Name: Test Script
// Description: Line 2
// Shortcut: cmd+t
// Background: true
// Schedule: 0 * * * *
`.trim()

  const { metadata } = parseMetadataComments(content, { maxLines: 3 })

  t.is(metadata.name, 'Test Script')
  t.is(metadata.description, 'Line 2')
  t.is(metadata.shortcut, 'cmd+t')
  t.is(metadata.background, undefined)
  t.is(metadata.schedule, undefined)
})

// Test parseSnippetMetadata
ava('parseSnippetMetadata - parses snippet with body', (t) => {
  const content = `
// Name: My Snippet
// Snippet: test
console.log("Hello World");
`.trim()

  const result = parseSnippetMetadata(content)

  t.is(result.metadata.name, 'My Snippet')
  t.is(result.snippetKey, 'test')
  t.is(result.postfix, false)
  t.is(result.snippetBody, 'console.log("Hello World");')
})

// Test parseSnippetMetadata with postfix
ava('parseSnippetMetadata - handles postfix snippets', (t) => {
  const content = `
// Name: Postfix Snippet
// Expand: *postfix
body content
`.trim()

  const result = parseSnippetMetadata(content)

  t.is(result.snippetKey, 'postfix')
  t.is(result.postfix, true)
  t.is(result.snippetBody, 'body content')
})

// Test parseSnippetMetadata with hash comments
ava('parseSnippetMetadata - handles hash-style comments', (t) => {
  const content = `
# Name: Shell Snippet
# Snippet: shell
echo "Hello"
`.trim()

  const result = parseSnippetMetadata(content)

  t.is(result.metadata.name, 'Shell Snippet')
  t.is(result.snippetKey, 'shell')
  t.is(result.snippetBody, 'echo "Hello"')
})

// Test all valid keys are in the set
ava('VALID_METADATA_KEYS_SET - contains all valid keys', (t) => {
  const expectedKeys = [
    'author', 'name', 'description', 'enter', 'alias', 'image', 'emoji',
    'shortcut', 'shortcode', 'trigger', 'snippet', 'expand', 'keyword',
    'pass', 'group', 'exclude', 'watch', 'log', 'background', 'system',
    'schedule', 'index', 'access', 'response', 'tag', 'longRunning',
    'mcp', 'timeout', 'cache', 'bin', 'postfix'
  ]

  for (const key of expectedKeys) {
    t.true(VALID_METADATA_KEYS_SET.has(key), `Expected '${key}' to be in valid keys set`)
  }
})

// Test empty content
ava('parseMetadataComments - handles empty content', (t) => {
  const { metadata, warnings } = parseMetadataComments('')

  t.deepEqual(metadata, {})
  t.is(warnings.length, 0)
})

// Test whitespace variations
ava('parseMetadataComments - handles various whitespace patterns', (t) => {
  // Test each pattern individually
  t.deepEqual(parseMetadataComments('//Name:Test').metadata, { name: 'Test' })
  t.deepEqual(parseMetadataComments('//Name: Test').metadata, { name: 'Test' })
  t.deepEqual(parseMetadataComments('// Name:Test').metadata, { name: 'Test' })
  t.deepEqual(parseMetadataComments('// Name: Test').metadata, { name: 'Test' })
  t.deepEqual(parseMetadataComments('//  Name:Test').metadata, { name: 'Test' })
  t.deepEqual(parseMetadataComments('//  Name: Test').metadata, { name: 'Test' })
})
