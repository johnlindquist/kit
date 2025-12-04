import ava from 'ava'
import * as path from 'node:path'
import {
  formatFileSize,
  humanizePermissions,
  formatPermissions,
  getFileTypeChar,
  isBinaryFileSync,
  safePath,
  isDescendant,
  getCommonAncestor,
  expandHome,
  getFileType
} from './path-helpers'

// ============================================================================
// formatFileSize tests
// ============================================================================

ava('formatFileSize - 0 bytes', (t) => {
  t.is(formatFileSize(0), '0 Bytes')
})

ava('formatFileSize - bytes', (t) => {
  t.is(formatFileSize(500), '500 Bytes')
})

ava('formatFileSize - kilobytes', (t) => {
  t.is(formatFileSize(1024), '1 KB')
  t.is(formatFileSize(1536), '1.5 KB')
})

ava('formatFileSize - megabytes', (t) => {
  t.is(formatFileSize(1048576), '1 MB')
  t.is(formatFileSize(1572864), '1.5 MB')
})

ava('formatFileSize - gigabytes', (t) => {
  t.is(formatFileSize(1073741824), '1 GB')
})

ava('formatFileSize - custom decimals', (t) => {
  t.is(formatFileSize(1536, 0), '2 KB')
  t.is(formatFileSize(1536, 3), '1.5 KB')
})

// ============================================================================
// humanizePermissions tests
// ============================================================================

ava('humanizePermissions - rwxr-xr-x (755)', (t) => {
  t.is(humanizePermissions(0o755), 'rwxr-xr-x')
})

ava('humanizePermissions - rw-r--r-- (644)', (t) => {
  t.is(humanizePermissions(0o644), 'rw-r--r--')
})

ava('humanizePermissions - rwx------ (700)', (t) => {
  t.is(humanizePermissions(0o700), 'rwx------')
})

ava('humanizePermissions - rw------- (600)', (t) => {
  t.is(humanizePermissions(0o600), 'rw-------')
})

// ============================================================================
// getFileTypeChar tests
// ============================================================================

ava('getFileTypeChar - regular file', (t) => {
  t.is(getFileTypeChar(0o100644), '-')
})

ava('getFileTypeChar - directory', (t) => {
  t.is(getFileTypeChar(0o040755), 'd')
})

ava('getFileTypeChar - symbolic link', (t) => {
  t.is(getFileTypeChar(0o120777), 'l')
})

// ============================================================================
// formatPermissions tests
// ============================================================================

ava('formatPermissions - regular file 644', (t) => {
  t.is(formatPermissions(0o100644), '-rw-r--r--')
})

ava('formatPermissions - directory 755', (t) => {
  t.is(formatPermissions(0o040755), 'drwxr-xr-x')
})

// ============================================================================
// isBinaryFileSync tests
// ============================================================================

ava('isBinaryFileSync - image extensions', (t) => {
  t.true(isBinaryFileSync('photo.jpg'))
  t.true(isBinaryFileSync('image.PNG'))
  t.true(isBinaryFileSync('logo.gif'))
})

ava('isBinaryFileSync - executable extensions', (t) => {
  t.true(isBinaryFileSync('app.exe'))
  t.true(isBinaryFileSync('library.dll'))
  t.true(isBinaryFileSync('binary.bin'))
})

ava('isBinaryFileSync - text extensions', (t) => {
  t.false(isBinaryFileSync('script.js'))
  t.false(isBinaryFileSync('style.css'))
  t.false(isBinaryFileSync('readme.md'))
})

// ============================================================================
// safePath tests
// ============================================================================

ava('safePath - joins segments', (t) => {
  const result = safePath('home', 'user', 'file.txt')
  t.is(result, path.normalize('home/user/file.txt'))
})

ava('safePath - filters empty segments', (t) => {
  const result = safePath('home', '', 'user', '', 'file.txt')
  t.is(result, path.normalize('home/user/file.txt'))
})

// ============================================================================
// isDescendant tests
// ============================================================================

ava('isDescendant - direct child', (t) => {
  t.true(isDescendant('/home/user', '/home/user/file.txt'))
})

ava('isDescendant - nested child', (t) => {
  t.true(isDescendant('/home/user', '/home/user/docs/file.txt'))
})

ava('isDescendant - not a descendant', (t) => {
  t.false(isDescendant('/home/user', '/home/other/file.txt'))
})

ava('isDescendant - parent is not descendant', (t) => {
  t.false(isDescendant('/home/user/docs', '/home/user'))
})

// ============================================================================
// getCommonAncestor tests
// ============================================================================

ava('getCommonAncestor - empty array', (t) => {
  t.is(getCommonAncestor([]), null)
})

ava('getCommonAncestor - single path', (t) => {
  // Use platform-appropriate paths
  const file = path.join('home', 'user', 'file.txt')
  const result = getCommonAncestor([file])
  // path.resolve will make these absolute, so check the result ends correctly
  t.true(result?.endsWith(path.join('home', 'user')) ?? false)
})

ava('getCommonAncestor - sibling files', (t) => {
  // Use platform-appropriate paths
  const file1 = path.join('home', 'user', 'a.txt')
  const file2 = path.join('home', 'user', 'b.txt')
  const result = getCommonAncestor([file1, file2])
  // path.resolve will make these absolute, so check the result ends correctly
  t.true(result?.endsWith(path.join('home', 'user')) ?? false)
})

ava('getCommonAncestor - different directories', (t) => {
  // Use platform-appropriate paths
  const file1 = path.join('home', 'user', 'docs', 'a.txt')
  const file2 = path.join('home', 'user', 'images', 'b.png')
  const result = getCommonAncestor([file1, file2])
  // path.resolve will make these absolute, so check the result ends correctly
  t.true(result?.endsWith(path.join('home', 'user')) ?? false)
})

// ============================================================================
// expandHome tests
// ============================================================================

ava('expandHome - tilde at start', (t) => {
  const home = process.env.HOME || process.env.USERPROFILE || ''
  const result = expandHome('~/Documents')
  t.is(result, path.join(home, 'Documents'))
})

ava('expandHome - no tilde', (t) => {
  const result = expandHome('/absolute/path')
  t.is(result, '/absolute/path')
})

ava('expandHome - tilde in middle (not expanded)', (t) => {
  const result = expandHome('/path/with~/tilde')
  t.is(result, '/path/with~/tilde')
})

// ============================================================================
// getFileType tests
// ============================================================================

ava('getFileType - javascript', (t) => {
  t.is(getFileType('script.js'), 'javascript')
  t.is(getFileType('component.jsx'), 'javascript')
})

ava('getFileType - typescript', (t) => {
  t.is(getFileType('app.ts'), 'typescript')
  t.is(getFileType('component.tsx'), 'typescript')
})

ava('getFileType - python', (t) => {
  t.is(getFileType('script.py'), 'python')
})

ava('getFileType - markdown', (t) => {
  t.is(getFileType('README.md'), 'markdown')
  t.is(getFileType('docs.markdown'), 'markdown')
})

ava('getFileType - unknown', (t) => {
  t.is(getFileType('file.xyz'), 'unknown')
})
