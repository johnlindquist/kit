/**
 * Theme validation utilities for Script Kit.
 * Provides helpers to validate theme CSS and check for required variables.
 */

import type { ThemeCSSVariable, ThemeValidationResult } from '../types/theme.js'
import { REQUIRED_THEME_VARIABLES } from '../types/theme.js'

/**
 * Validate a theme CSS string for required variables.
 * Checks that all required CSS custom properties are present.
 *
 * @param css - Raw theme CSS string
 * @returns Validation result with missing variables and warnings
 *
 * @example
 * ```ts
 * const result = validateThemeCSS(themeCSS)
 * if (!result.valid) {
 *   console.warn('Missing variables:', result.missing)
 * }
 * ```
 */
export function validateThemeCSS(css: string): ThemeValidationResult {
  const missing: ThemeCSSVariable[] = []
  const warnings: string[] = []

  // Check for required variables
  for (const variable of REQUIRED_THEME_VARIABLES) {
    if (!css.includes(variable)) {
      missing.push(variable)
    }
  }

  // Check for recommended variables (non-blocking)
  const recommendedVariables: ThemeCSSVariable[] = [
    '--name',
    '--opacity-mac',
    '--opacity-win',
    '--opacity-other',
    '--mono-font',
    '--sans-font',
  ]

  for (const variable of recommendedVariables) {
    if (!css.includes(variable)) {
      warnings.push(`Recommended variable '${variable}' is not defined`)
    }
  }

  // Check for :root selector
  if (!css.includes(':root')) {
    warnings.push('Theme should define variables in :root selector')
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  }
}

/**
 * Check if a theme CSS string is valid (has all required variables).
 * Convenience wrapper around validateThemeCSS.
 *
 * @param css - Raw theme CSS string
 * @returns True if the theme is valid
 *
 * @example
 * ```ts
 * if (isValidTheme(themeCSS)) {
 *   applyTheme(themeCSS)
 * }
 * ```
 */
export function isValidTheme(css: string): boolean {
  return validateThemeCSS(css).valid
}

/**
 * Get a human-readable error message for invalid themes.
 *
 * @param result - Validation result from validateThemeCSS
 * @returns Error message describing the issues
 *
 * @example
 * ```ts
 * const result = validateThemeCSS(themeCSS)
 * if (!result.valid) {
 *   console.error(getValidationErrorMessage(result))
 * }
 * ```
 */
export function getValidationErrorMessage(result: ThemeValidationResult): string {
  if (result.valid) {
    return 'Theme is valid'
  }

  const missingList = result.missing.map((v) => `  - ${v}`).join('\n')
  return `Theme is missing required CSS variables:\n${missingList}`
}

/**
 * Get a human-readable warning message for theme recommendations.
 *
 * @param result - Validation result from validateThemeCSS
 * @returns Warning message or empty string if no warnings
 *
 * @example
 * ```ts
 * const result = validateThemeCSS(themeCSS)
 * const warnings = getValidationWarningMessage(result)
 * if (warnings) {
 *   console.warn(warnings)
 * }
 * ```
 */
export function getValidationWarningMessage(result: ThemeValidationResult): string {
  if (result.warnings.length === 0) {
    return ''
  }

  const warningList = result.warnings.map((w) => `  - ${w}`).join('\n')
  return `Theme recommendations:\n${warningList}`
}

/**
 * Validate and report theme issues to console.
 * Useful for development and debugging.
 *
 * @param css - Raw theme CSS string
 * @param themeName - Optional theme name for the log message
 * @returns True if the theme is valid
 *
 * @example
 * ```ts
 * // Will log warnings/errors to console
 * validateAndReport(themeCSS, 'my-custom-theme.css')
 * ```
 */
export function validateAndReport(css: string, themeName?: string): boolean {
  const result = validateThemeCSS(css)
  const prefix = themeName ? `Theme "${themeName}"` : 'Theme'

  if (!result.valid) {
    console.error(`${prefix} validation failed:`, getValidationErrorMessage(result))
  }

  if (result.warnings.length > 0) {
    console.warn(`${prefix} warnings:`, getValidationWarningMessage(result))
  }

  return result.valid
}
