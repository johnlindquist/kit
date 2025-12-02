/**
 * Path Helper Utilities for Script Kit
 *
 * A collection of utilities for working with files and paths.
 * These complement the path browser functionality.
 */

import fs from 'node:fs'
import { stat, readFile } from 'node:fs/promises'
import * as path from 'node:path'

// ============================================================================
// File Size Formatting
// ============================================================================

/**
 * Format bytes into human-readable file size
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string like "1.5 MB"
 *
 * @example
 * formatFileSize(1024) // "1 KB"
 * formatFileSize(1536000) // "1.46 MB"
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

// ============================================================================
// Permission Formatting
// ============================================================================

/**
 * Convert Unix file mode to human-readable permission string (like ls -l)
 * @param mode - Unix file mode (e.g., 0o755)
 * @returns Permission string like "rwxr-xr-x"
 *
 * @example
 * humanizePermissions(0o755) // "rwxr-xr-x"
 * humanizePermissions(0o644) // "rw-r--r--"
 */
export function humanizePermissions(mode: number): string {
  const perms = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx']
  const owner = perms[(mode >> 6) & 7]
  const group = perms[(mode >> 3) & 7]
  const other = perms[mode & 7]
  return owner + group + other
}

/**
 * Get file type character for ls -l style output
 * @param mode - Unix file mode
 * @returns Single character representing file type
 */
export function getFileTypeChar(mode: number): string {
  const S_IFMT = 0o170000 // File type mask
  const S_IFSOCK = 0o140000 // Socket
  const S_IFLNK = 0o120000 // Symbolic link
  const S_IFREG = 0o100000 // Regular file
  const S_IFBLK = 0o060000 // Block device
  const S_IFDIR = 0o040000 // Directory
  const S_IFCHR = 0o020000 // Character device
  const S_IFIFO = 0o010000 // FIFO

  const type = mode & S_IFMT
  switch (type) {
    case S_IFSOCK:
      return 's'
    case S_IFLNK:
      return 'l'
    case S_IFREG:
      return '-'
    case S_IFBLK:
      return 'b'
    case S_IFDIR:
      return 'd'
    case S_IFCHR:
      return 'c'
    case S_IFIFO:
      return 'p'
    default:
      return '?'
  }
}

/**
 * Format full permission string like ls -l output
 * @param mode - Unix file mode
 * @returns Full permission string like "drwxr-xr-x"
 */
export function formatPermissions(mode: number): string {
  return getFileTypeChar(mode) + humanizePermissions(mode)
}

// ============================================================================
// Binary File Detection
// ============================================================================

// Common binary file signatures (magic bytes)
const BINARY_SIGNATURES: Array<{ bytes: number[]; offset?: number }> = [
  // Executables
  { bytes: [0x7f, 0x45, 0x4c, 0x46] }, // ELF
  { bytes: [0x4d, 0x5a] }, // DOS/Windows EXE
  { bytes: [0xfe, 0xed, 0xfa, 0xce] }, // Mach-O 32-bit
  { bytes: [0xfe, 0xed, 0xfa, 0xcf] }, // Mach-O 64-bit
  { bytes: [0xca, 0xfe, 0xba, 0xbe] }, // Mach-O universal

  // Archives
  { bytes: [0x50, 0x4b, 0x03, 0x04] }, // ZIP (includes DOCX, XLSX, JAR)
  { bytes: [0x1f, 0x8b] }, // GZIP
  { bytes: [0x52, 0x61, 0x72, 0x21] }, // RAR
  { bytes: [0x37, 0x7a, 0xbc, 0xaf] }, // 7z

  // Images
  { bytes: [0xff, 0xd8, 0xff] }, // JPEG
  { bytes: [0x89, 0x50, 0x4e, 0x47] }, // PNG
  { bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF
  { bytes: [0x42, 0x4d] }, // BMP
  { bytes: [0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50] }, // JPEG 2000
  { bytes: [0x49, 0x49, 0x2a, 0x00] }, // TIFF (little endian)
  { bytes: [0x4d, 0x4d, 0x00, 0x2a] }, // TIFF (big endian)
  { bytes: [0x52, 0x49, 0x46, 0x46] }, // WEBP (RIFF header)

  // Audio/Video
  { bytes: [0x49, 0x44, 0x33] }, // MP3 with ID3
  { bytes: [0xff, 0xfb] }, // MP3 without ID3
  { bytes: [0xff, 0xfa] }, // MP3 without ID3
  { bytes: [0x4f, 0x67, 0x67, 0x53] }, // OGG
  { bytes: [0x66, 0x4c, 0x61, 0x43] }, // FLAC
  { bytes: [0x00, 0x00, 0x00], offset: 4 }, // MP4/MOV (check ftyp at offset 4)

  // Documents
  { bytes: [0x25, 0x50, 0x44, 0x46] }, // PDF
  { bytes: [0xd0, 0xcf, 0x11, 0xe0] }, // MS Office (DOC, XLS, PPT)

  // Databases
  { bytes: [0x53, 0x51, 0x4c, 0x69] }, // SQLite

  // Fonts
  { bytes: [0x00, 0x01, 0x00, 0x00] }, // TrueType
  { bytes: [0x4f, 0x54, 0x54, 0x4f] }, // OpenType
  { bytes: [0x77, 0x4f, 0x46, 0x46] }, // WOFF
  { bytes: [0x77, 0x4f, 0x46, 0x32] } // WOFF2
]

// Binary file extensions (fallback check)
const BINARY_EXTENSIONS = new Set([
  // Executables
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.bin',
  '.app',

  // Archives
  '.zip',
  '.gz',
  '.tar',
  '.rar',
  '.7z',
  '.bz2',
  '.xz',

  // Images
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.bmp',
  '.ico',
  '.webp',
  '.tiff',
  '.psd',
  '.svg', // SVG is XML but often treated as binary

  // Audio
  '.mp3',
  '.wav',
  '.ogg',
  '.flac',
  '.aac',
  '.m4a',

  // Video
  '.mp4',
  '.avi',
  '.mov',
  '.wmv',
  '.mkv',
  '.webm',

  // Documents
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',

  // Databases
  '.db',
  '.sqlite',
  '.sqlite3',

  // Fonts
  '.ttf',
  '.otf',
  '.woff',
  '.woff2',
  '.eot',

  // Other
  '.class',
  '.pyc',
  '.o',
  '.obj',
  '.node'
])

/**
 * Check if a file is likely binary based on magic bytes and extension
 * @param filePath - Path to the file
 * @returns true if file appears to be binary
 *
 * @example
 * await isBinaryFile('/path/to/image.png') // true
 * await isBinaryFile('/path/to/script.js') // false
 */
export async function isBinaryFile(filePath: string): Promise<boolean> {
  // Quick check by extension first
  const ext = path.extname(filePath).toLowerCase()
  if (BINARY_EXTENSIONS.has(ext)) {
    return true
  }

  try {
    // Read first 512 bytes to check for binary content
    const fd = await fs.promises.open(filePath, 'r')
    try {
      const buffer = Buffer.alloc(512)
      const { bytesRead } = await fd.read(buffer, 0, 512, 0)

      if (bytesRead === 0) {
        return false // Empty file
      }

      // Check magic bytes
      for (const sig of BINARY_SIGNATURES) {
        const offset = sig.offset || 0
        if (offset + sig.bytes.length > bytesRead) continue

        let match = true
        for (let i = 0; i < sig.bytes.length; i++) {
          if (buffer[offset + i] !== sig.bytes[i]) {
            match = false
            break
          }
        }
        if (match) return true
      }

      // Check for null bytes (common in binary files)
      for (let i = 0; i < bytesRead; i++) {
        if (buffer[i] === 0) {
          return true
        }
      }

      // Check for high ratio of non-printable characters
      let nonPrintable = 0
      for (let i = 0; i < bytesRead; i++) {
        const byte = buffer[i]
        // Allow common whitespace and printable ASCII
        if (byte < 7 || (byte > 14 && byte < 32 && byte !== 27)) {
          nonPrintable++
        }
      }

      // If more than 10% non-printable, likely binary
      return nonPrintable / bytesRead > 0.1
    } finally {
      await fd.close()
    }
  } catch {
    // If we can't read, fall back to extension check
    return BINARY_EXTENSIONS.has(ext)
  }
}

/**
 * Synchronous version of isBinaryFile (extension-only check)
 * @param filePath - Path to the file
 * @returns true if file extension suggests binary content
 */
export function isBinaryFileSync(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase()
  return BINARY_EXTENSIONS.has(ext)
}

// ============================================================================
// Path Utilities
// ============================================================================

/**
 * Safely join paths, handling edge cases
 */
export function safePath(...segments: string[]): string {
  return path.normalize(path.join(...segments.filter(Boolean)))
}

/**
 * Check if a path is a descendant of another path
 * @param parent - Parent directory path
 * @param child - Potential child path
 * @returns true if child is inside parent
 */
export function isDescendant(parent: string, child: string): boolean {
  const relative = path.relative(parent, child)
  return !relative.startsWith('..') && !path.isAbsolute(relative)
}

/**
 * Get the common ancestor path of multiple paths
 * @param paths - Array of paths
 * @returns Common ancestor path or null if none
 */
export function getCommonAncestor(paths: string[]): string | null {
  if (paths.length === 0) return null
  if (paths.length === 1) return path.dirname(paths[0])

  const normalized = paths.map((p) => path.resolve(p))
  const parts = normalized.map((p) => p.split(path.sep))

  const common: string[] = []
  for (let i = 0; i < parts[0].length; i++) {
    const segment = parts[0][i]
    if (parts.every((p) => p[i] === segment)) {
      common.push(segment)
    } else {
      break
    }
  }

  return common.length > 0 ? common.join(path.sep) || path.sep : null
}

/**
 * Expand ~ to home directory in path
 * @param filePath - Path that may contain ~
 * @returns Expanded path
 */
export function expandHome(filePath: string): string {
  if (filePath.startsWith('~')) {
    const home = process.env.HOME || process.env.USERPROFILE || ''
    return path.join(home, filePath.slice(1))
  }
  return filePath
}

// ============================================================================
// File Type Detection
// ============================================================================

/**
 * Get file type from extension
 */
export function getFileType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const types: Record<string, string> = {
    // Code
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'header',
    '.hpp': 'header',
    '.cs': 'csharp',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.php': 'php',
    '.sh': 'shell',
    '.bash': 'shell',
    '.zsh': 'shell',

    // Web
    '.html': 'html',
    '.htm': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.less': 'less',
    '.vue': 'vue',
    '.svelte': 'svelte',

    // Data
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.xml': 'xml',
    '.csv': 'csv',
    '.toml': 'toml',

    // Docs
    '.md': 'markdown',
    '.markdown': 'markdown',
    '.txt': 'text',
    '.pdf': 'pdf',
    '.doc': 'word',
    '.docx': 'word',

    // Config
    '.env': 'env',
    '.gitignore': 'gitignore',
    '.npmrc': 'npmrc',
    '.editorconfig': 'editorconfig'
  }

  return types[ext] || 'unknown'
}

// Export all utilities
export default {
  formatFileSize,
  humanizePermissions,
  getFileTypeChar,
  formatPermissions,
  isBinaryFile,
  isBinaryFileSync,
  safePath,
  isDescendant,
  getCommonAncestor,
  expandHome,
  getFileType
}
