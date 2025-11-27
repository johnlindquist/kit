/**
 * Theme utility functions for Script Kit.
 * Provides helpers for parsing theme CSS, resolving platform-specific values,
 * and extracting theme metadata.
 */

import type { Appearance, ThemePlatform, ThemeCSSVariable } from '../types/theme.js'

/**
 * Default opacity value when not specified in theme.
 */
export const DEFAULT_OPACITY = '0.5'

/**
 * Resolve the platform-specific opacity from a theme CSS string.
 * Looks for --opacity-mac, --opacity-win, or --opacity-other based on platform.
 *
 * @param css - Raw theme CSS string
 * @param platform - Target platform ('mac', 'win', or 'other')
 * @returns Opacity value as a string (e.g., "0.5")
 *
 * @example
 * ```ts
 * const css = ':root { --opacity-mac: 0.25; --opacity-win: 0.5; }'
 * resolveOpacity(css, 'mac')   // "0.25"
 * resolveOpacity(css, 'win')   // "0.5"
 * resolveOpacity(css, 'other') // "0.5" (default)
 * ```
 */
export function resolveOpacity(css: string, platform: ThemePlatform): string {
  const key = `--opacity-${platform}`
  const match = new RegExp(`${key}:\\s*([\\d.]+)`).exec(css)
  return match?.[1] ?? DEFAULT_OPACITY
}

/**
 * Detect the current platform for theme opacity resolution.
 *
 * @returns Platform identifier
 *
 * @example
 * ```ts
 * const platform = detectPlatform()
 * const opacity = resolveOpacity(themeCSS, platform)
 * ```
 */
export function detectPlatform(): ThemePlatform {
  if (typeof process !== 'undefined') {
    if (process.platform === 'darwin') return 'mac'
    if (process.platform === 'win32') return 'win'
  }
  return 'other'
}

/**
 * Extract the appearance (light/dark) from a theme CSS string.
 *
 * @param css - Raw theme CSS string
 * @returns Appearance value or undefined if not found
 *
 * @example
 * ```ts
 * const css = ':root { --appearance: dark; }'
 * extractAppearance(css) // "dark"
 * ```
 */
export function extractAppearance(css: string): Appearance | undefined {
  const match = /--appearance:\s*(\w+)/.exec(css)
  const value = match?.[1]
  if (value === 'light' || value === 'dark') {
    return value
  }
  return undefined
}

/**
 * Extract a CSS variable value from a theme string.
 *
 * @param css - Raw theme CSS string
 * @param variable - CSS variable name (e.g., '--color-primary')
 * @returns Variable value or undefined if not found
 *
 * @example
 * ```ts
 * const css = ':root { --color-primary: #fbbf24ee; }'
 * extractCSSVariable(css, '--color-primary') // "#fbbf24ee"
 * ```
 */
export function extractCSSVariable(css: string, variable: ThemeCSSVariable): string | undefined {
  // Handle quoted values (like --name: "Theme Name")
  const quotedMatch = new RegExp(`${variable}:\\s*"([^"]+)"`).exec(css)
  if (quotedMatch) {
    return quotedMatch[1]
  }

  // Handle unquoted values (like --color-primary: #fff)
  const unquotedMatch = new RegExp(`${variable}:\\s*([^;]+)`).exec(css)
  if (unquotedMatch) {
    return unquotedMatch[1].trim()
  }

  return undefined
}

/**
 * Check if a theme CSS string indicates a dark theme.
 *
 * @param css - Raw theme CSS string
 * @returns True if the theme is dark
 *
 * @example
 * ```ts
 * isDarkTheme(':root { --appearance: dark; }')  // true
 * isDarkTheme(':root { --appearance: light; }') // false
 * ```
 */
export function isDarkTheme(css: string): boolean {
  return extractAppearance(css) === 'dark'
}

/**
 * Check if a theme CSS string indicates a light theme.
 *
 * @param css - Raw theme CSS string
 * @returns True if the theme is light
 */
export function isLightTheme(css: string): boolean {
  return extractAppearance(css) === 'light'
}

/**
 * Apply resolved opacity to the document root element.
 * Safe to call in browser environments only.
 * Note: This function is a no-op in Node.js environments.
 *
 * @param opacity - Opacity value string
 *
 * @example
 * ```ts
 * const opacity = resolveOpacity(themeCSS, detectPlatform())
 * applyOpacityToDocument(opacity)
 * ```
 */
export function applyOpacityToDocument(opacity: string): void {
  // This is only available in browser environments
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (typeof globalThis !== 'undefined' && 'document' in globalThis) {
    const doc = globalThis.document as { documentElement: { style: { setProperty: (name: string, value: string) => void } } }
    doc.documentElement.style.setProperty('--opacity', opacity)
  }
}

/**
 * Resolve and apply platform-specific opacity from theme CSS.
 * Convenience function combining resolveOpacity and applyOpacityToDocument.
 *
 * @param css - Raw theme CSS string
 * @param platform - Optional platform override (auto-detected if not provided)
 *
 * @example
 * ```ts
 * // Auto-detect platform and apply opacity
 * applyThemeOpacity(themeCSS)
 *
 * // Force specific platform
 * applyThemeOpacity(themeCSS, 'mac')
 * ```
 */
export function applyThemeOpacity(css: string, platform?: ThemePlatform): void {
  const targetPlatform = platform ?? detectPlatform()
  const opacity = resolveOpacity(css, targetPlatform)
  applyOpacityToDocument(opacity)
}
