/**
 * Unified Metadata Parser
 *
 * Single source of truth for parsing script metadata comments.
 * Used by both SDK (parseScript, getMetadata) and App (parseSnippet).
 *
 * @example
 * // In SDK:
 * import { parseMetadataComments } from './metadata-parser.js'
 * const { metadata, warnings } = parseMetadataComments(contents)
 *
 * // In App:
 * import { parseMetadataComments, VALID_METADATA_KEYS } from '@johnlindquist/kit/core/metadata-parser'
 * const { metadata, warnings } = parseMetadataComments(contents, { validate: false })
 */

import type { Metadata } from '../types/core.js'

/**
 * Warning generated when parsing metadata
 */
export interface MetadataWarning {
  line: number
  key: string
  message: string
  suggestion?: string // e.g., "Did you mean 'shortcut'?"
}

/**
 * Result from parsing metadata comments
 */
export interface ParseMetadataResult {
  metadata: Partial<Metadata>
  warnings: MetadataWarning[]
  /** Raw key-value pairs before validation (includes invalid keys) */
  raw: Record<string, string | boolean | number>
}

/**
 * Options for parseMetadataComments
 */
export interface ParseMetadataOptions {
  /** Whether to validate keys against VALID_METADATA_KEYS (default: true) */
  validate?: boolean
  /** Maximum lines to scan for metadata (default: undefined = all lines) */
  maxLines?: number
  /** Whether to stop at first non-comment line (default: false) */
  stopAtFirstNonComment?: boolean
}

// Exhaustive, compile-time-checked list of metadata keys.
export const VALID_METADATA_KEYS = [
  "author",
  "name",
  "description",
  "enter",
  "alias",
  "image",
  "emoji",
  "shortcut",
  "shortcode",
  "trigger",
  "snippet", // Keep deprecated for now
  "expand",
  "keyword",
  "pass",
  "group",
  "exclude",
  "watch",
  "log",
  "background",
  "system",
  "schedule",
  "index",
  "access",
  "response",
  "tag",
  "longRunning",
  "mcp",
  'timeout',
  'cache',
  'bin',
  // Snippet-specific keys
  'postfix',
] as const satisfies readonly string[]

export type ValidMetadataKey = typeof VALID_METADATA_KEYS[number]

export const VALID_METADATA_KEYS_SET: ReadonlySet<string> = new Set(VALID_METADATA_KEYS)

// Common prefixes to ignore (not metadata)
const IGNORE_KEY_PREFIXES = ['TODO', 'FIXME', 'NOTE', 'HACK', 'XXX', 'BUG']

// Valid metadata key pattern: starts with a letter, can contain letters, numbers, and underscores
const VALID_KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/

// Regex to match comment lines with metadata
const COMMENT_REGEX = {
  '//': /^\/\/\s*([^:]+):(.*)$/,
  '#': /^#\s*([^:]+):(.*)$/
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for suggesting corrections for typos in metadata keys
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

/**
 * Find the closest valid metadata key to the given unknown key
 * Returns undefined if no close match is found (distance > 2)
 */
function findClosestKey(unknownKey: string): string | undefined {
  const lowerKey = unknownKey.toLowerCase()
  let closest: string | undefined
  let closestDistance = Infinity

  for (const validKey of VALID_METADATA_KEYS) {
    const distance = levenshteinDistance(lowerKey, validKey.toLowerCase())
    if (distance < closestDistance && distance <= 2) {
      closestDistance = distance
      closest = validKey
    }
  }

  return closest
}

/**
 * Parse a value string into the appropriate type
 */
function parseValue(value: string, key: string): string | boolean | number {
  const lowerValue = value.toLowerCase()
  const lowerKey = key.toLowerCase()

  if (lowerValue === 'true') return true
  if (lowerValue === 'false') return false
  if (lowerKey === 'timeout' || lowerKey === 'index') {
    const num = Number.parseInt(value, 10)
    return Number.isNaN(num) ? value : num
  }

  return value
}

/**
 * Parse metadata from comment lines in script content.
 *
 * Supports both `//` and `#` comment styles.
 * Handles multiline comments (skips them).
 * Returns structured warnings for unknown/invalid keys.
 *
 * @param contents - The script file contents
 * @param options - Parsing options
 * @returns Parsed metadata, warnings, and raw key-value pairs
 */
export function parseMetadataComments(
  contents: string,
  options: ParseMetadataOptions = {}
): ParseMetadataResult {
  const { validate = true, maxLines, stopAtFirstNonComment = false } = options

  const lines = contents.split('\n')
  const metadata: Partial<Metadata> = {}
  const raw: Record<string, string | boolean | number> = {}
  const warnings: MetadataWarning[] = []

  let inMultilineComment = false
  let multilineCommentEnd: string | null = null
  let foundFirstComment = false
  let consecutiveNonCommentLines = 0

  const linesToProcess = maxLines ? Math.min(lines.length, maxLines) : lines.length

  for (let lineIndex = 0; lineIndex < linesToProcess; lineIndex++) {
    const line = lines[lineIndex]
    const trimmedLine = line.trim()

    // Check for the start of a multiline comment block
    if (
      !inMultilineComment &&
      (trimmedLine.startsWith('/*') ||
        trimmedLine.startsWith("'''") ||
        trimmedLine.startsWith('"""') ||
        trimmedLine.match(/^: '/))
    ) {
      inMultilineComment = true
      multilineCommentEnd = trimmedLine.startsWith('/*')
        ? '*/'
        : trimmedLine.startsWith(": '")
          ? "'"
          : trimmedLine.startsWith("'''")
            ? "'''"
            : '"""'
    }

    // Check for the end of a multiline comment block
    if (inMultilineComment && trimmedLine.endsWith(multilineCommentEnd!)) {
      inMultilineComment = false
      multilineCommentEnd = null
      continue
    }

    // Skip lines that are part of a multiline comment block
    if (inMultilineComment) continue

    // Determine comment style and try to match metadata
    let match: RegExpMatchArray | null = null
    if (line.startsWith('//')) {
      match = line.match(COMMENT_REGEX['//'])
      foundFirstComment = true
      consecutiveNonCommentLines = 0
    } else if (line.startsWith('#')) {
      match = line.match(COMMENT_REGEX['#'])
      foundFirstComment = true
      consecutiveNonCommentLines = 0
    } else {
      // Non-comment line
      consecutiveNonCommentLines++
      if (stopAtFirstNonComment && foundFirstComment && consecutiveNonCommentLines > 0) {
        break
      }
      continue
    }

    if (!match) continue

    // Extract and trim the key and value
    const [, rawKey, value] = match
    const trimmedKey = rawKey.trim()
    const trimmedValue = value.trim()

    // Skip if key starts with common prefixes to ignore
    if (IGNORE_KEY_PREFIXES.some(prefix => trimmedKey.toUpperCase().startsWith(prefix))) {
      continue
    }

    // Skip if key doesn't match valid pattern (e.g., contains URL like "https://")
    if (!VALID_KEY_PATTERN.test(trimmedKey)) {
      continue
    }

    // Transform the key case to match valid metadata keys
    // First, normalize by lowercasing the first letter
    let key = trimmedKey
    if (key.length > 0) {
      key = key[0].toLowerCase() + key.slice(1)
    }

    // If the key is all lowercase after normalization but not in valid set,
    // try to find matching camelCase key (e.g., "LONGRUNNING" -> "longRunning")
    const lowerKey = key.toLowerCase()
    const matchingValidKey = VALID_METADATA_KEYS.find(
      validKey => validKey.toLowerCase() === lowerKey
    )
    if (matchingValidKey) {
      key = matchingValidKey
    }

    // Skip empty keys or values
    if (!key || !trimmedValue) {
      continue
    }

    // Parse the value
    const parsedValue = parseValue(trimmedValue, key)

    // Store in raw (before validation)
    if (!(key in raw)) {
      raw[key] = parsedValue
    }

    // Validate the key
    if (validate) {
      if (!VALID_METADATA_KEYS_SET.has(key)) {
        const suggestion = findClosestKey(key)
        warnings.push({
          line: lineIndex + 1,
          key,
          message: `Unknown metadata key '${key}'`,
          suggestion: suggestion ? `Did you mean '${suggestion}'?` : undefined
        })
        continue
      }
    }

    // Only assign if the key hasn't been assigned before
    if (!(key in metadata)) {
      (metadata as any)[key] = parsedValue
    }
  }

  return { metadata, warnings, raw }
}

/**
 * Simplified parser for snippets that stops at first non-comment line.
 * Returns both metadata and the remaining content after metadata lines.
 *
 * @param contents - The snippet file contents
 * @returns Parsed metadata and the snippet body
 */
export function parseSnippetMetadata(
  contents: string
): {
  metadata: Partial<Metadata>
  warnings: MetadataWarning[]
  snippetBody: string
  snippetKey: string
  postfix: boolean
} {
  const lines = contents.split('\n')
  let snippetStartIndex = lines.length

  // Find where metadata ends
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(/^(?:\/\/|#)\s{0,2}([\w-]+):\s*(.*)/)
    if (!match) {
      snippetStartIndex = i
      break
    }
  }

  const metadataSection = lines.slice(0, snippetStartIndex).join('\n')
  const snippetBody = lines.slice(snippetStartIndex).join('\n')

  const { metadata, warnings, raw } = parseMetadataComments(metadataSection, { validate: true })

  // Extract snippet/expand key (may be in raw if validation failed)
  let expandKey = (metadata.snippet || metadata.expand || raw.snippet || raw.expand || '') as string
  let postfix = false

  if (expandKey.startsWith('*')) {
    postfix = true
    expandKey = expandKey.slice(1)
  }

  return {
    metadata,
    warnings,
    snippetBody,
    snippetKey: expandKey,
    postfix
  }
}
