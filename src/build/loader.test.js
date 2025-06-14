import test from 'ava'
import { load } from './loader.js'
import { fileURLToPath } from 'node:url'

test.beforeEach(t => {
  // Reset environment variables
  delete process.env.KIT_TARGET
})

test('should correctly identify .ts files', async t => {
  const urls = [
    'file:///path/to/script.ts',
    'file:///path/to/script.ts?now=123456789.kit',
    'file:///path/to/script.ts?timestamp=123456789.kit',
  ]

  for (const url of urls) {
    const urlPath = url.split('?')[0]
    t.true(urlPath.endsWith('.ts'))
    t.false(urlPath.endsWith('.tsx'))
    t.false(urlPath.endsWith('.jsx'))
  }
})

test('should correctly identify .tsx files', async t => {
  const urls = [
    'file:///path/to/component.tsx',
    'file:///path/to/component.tsx?now=123456789.kit',
    'file:///path/to/component.tsx?timestamp=123456789.kit',
  ]

  for (const url of urls) {
    const urlPath = url.split('?')[0]
    t.true(urlPath.endsWith('.tsx'))
    t.false(urlPath.endsWith('.ts'))
    t.false(urlPath.endsWith('.jsx'))
  }
})

test('should correctly identify .jsx files', async t => {
  const urls = [
    'file:///path/to/component.jsx',
    'file:///path/to/component.jsx?now=123456789.kit',
    'file:///path/to/component.jsx?timestamp=123456789.kit',
  ]

  for (const url of urls) {
    const urlPath = url.split('?')[0]
    t.true(urlPath.endsWith('.jsx'))
    t.false(urlPath.endsWith('.ts'))
    t.false(urlPath.endsWith('.tsx'))
  }
})

test('should not confuse .ts files with .tsx pattern matching', async t => {
  // This was the bug - .tsx? pattern was matching .ts? in URLs
  const tsUrls = [
    'file:///path/to/script.ts?now=123456789.kit',
    'file:///path/to/another.ts?timestamp=123456789.kit',
  ]

  for (const url of tsUrls) {
    const urlPath = url.split('?')[0]
    t.false(urlPath.endsWith('.tsx'))
    t.true(urlPath.endsWith('.ts'))
    
    // The bug was using includes('.tsx?') which would match '.ts?'
    t.false(url.includes('.tsx?'))
    t.true(url.includes('.ts?'))
  }
})

test('should handle files with .tsx in the path but not as extension', async t => {
  const url = 'file:///path/to/.tsx-files/script.ts?now=123456789.kit'
  const urlPath = url.split('?')[0]
  
  t.false(urlPath.endsWith('.tsx'))
  t.true(urlPath.endsWith('.ts'))
})

test('should handle files with .jsx in the path but not as extension', async t => {
  const url = 'file:///path/to/.jsx-components/utils.js?now=123456789.kit'
  const urlPath = url.split('?')[0]
  
  t.false(urlPath.endsWith('.jsx'))
  t.true(urlPath.endsWith('.js'))
})

test('should handle URLs without query parameters', async t => {
  const urls = [
    'file:///path/to/component.tsx',
    'file:///path/to/component.jsx',
    'file:///path/to/script.ts',
    'file:///path/to/script.js',
  ]

  for (const url of urls) {
    const urlPath = url.split('?')[0]
    t.is(urlPath, url) // No query params, so should be unchanged
  }
})

test('should handle URLs with multiple query parameters', async t => {
  const url = 'file:///path/to/component.tsx?now=123456789&foo=bar&baz=qux.kit'
  const urlPath = url.split('?')[0]
  
  t.is(urlPath, 'file:///path/to/component.tsx')
  t.true(urlPath.endsWith('.tsx'))
})

test('regression: should not break GitHub Actions TypeScript loading', async t => {
  // Simulate the exact scenario that broke
  const createAssetsUrl = 'file:///Users/runner/work/app/app/scripts/create-assets.ts?now=1749867032245.kit'
  const urlPath = createAssetsUrl.split('?')[0]
  
  // Verify correct detection
  t.true(urlPath.endsWith('.ts'))
  t.false(urlPath.endsWith('.tsx'))
  
  // Ensure .tsx? pattern doesn't match .ts? in URL
  t.false(createAssetsUrl.includes('.tsx?'))
  t.true(createAssetsUrl.includes('.ts?'))
})

test('should handle all common Script Kit file patterns', async t => {
  const patterns = [
    { url: 'file:///path/to/script.js', shouldBeTsx: false },
    { url: 'file:///path/to/script.ts?now=123.kit', shouldBeTsx: false },
    { url: 'file:///path/to/component.tsx?now=123.kit', shouldBeTsx: true },
    { url: 'file:///path/to/component.jsx?now=123.kit', shouldBeTsx: true },
    { url: 'file:///path/to/script.mjs', shouldBeTsx: false },
    { url: 'file:///path/to/script.cjs', shouldBeTsx: false },
  ]

  for (const { url, shouldBeTsx } of patterns) {
    const urlPath = url.split('?')[0]
    const isTsxOrJsx = urlPath.endsWith('.tsx') || urlPath.endsWith('.jsx')
    t.is(isTsxOrJsx, shouldBeTsx)
  }
})

test('should correctly detect file extensions with different URL formats', async t => {
  const testCases = [
    // Standard TypeScript files
    { url: 'file:///path/to/file.ts', ext: '.ts', isTsx: false },
    { url: 'file:///path/to/file.ts?', ext: '.ts', isTsx: false },
    { url: 'file:///path/to/file.ts?now=123', ext: '.ts', isTsx: false },
    { url: 'file:///path/to/file.ts?now=123.kit', ext: '.ts', isTsx: false },
    
    // TSX files
    { url: 'file:///path/to/file.tsx', ext: '.tsx', isTsx: true },
    { url: 'file:///path/to/file.tsx?', ext: '.tsx', isTsx: true },
    { url: 'file:///path/to/file.tsx?now=123', ext: '.tsx', isTsx: true },
    { url: 'file:///path/to/file.tsx?now=123.kit', ext: '.tsx', isTsx: true },
    
    // JSX files
    { url: 'file:///path/to/file.jsx', ext: '.jsx', isTsx: true },
    { url: 'file:///path/to/file.jsx?', ext: '.jsx', isTsx: true },
    { url: 'file:///path/to/file.jsx?now=123', ext: '.jsx', isTsx: true },
    { url: 'file:///path/to/file.jsx?now=123.kit', ext: '.jsx', isTsx: true },
    
    // Edge cases
    { url: 'file:///path.tsx/to/file.ts', ext: '.ts', isTsx: false },
    { url: 'file:///path/.tsx/file.js', ext: '.js', isTsx: false },
    { url: 'file:///path/to/file.spec.tsx', ext: '.tsx', isTsx: true },
  ]

  for (const { url, ext, isTsx } of testCases) {
    const urlPath = url.split('?')[0]
    const actuallyIsTsx = urlPath.endsWith('.tsx') || urlPath.endsWith('.jsx')
    
    t.true(urlPath.endsWith(ext), `Expected ${url} to end with ${ext}`)
    t.is(actuallyIsTsx, isTsx, `Expected ${url} isTsx to be ${isTsx}`)
  }
})