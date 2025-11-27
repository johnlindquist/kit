/**
 * Theme loading utilities for Script Kit.
 * Provides shared logic for loading and building theme choices,
 * eliminating duplication between theme-selector.ts and new-theme.ts.
 */

import { globby } from 'globby'
import type { ThemePaths, ThemeChoice, ThemeGroup } from '../types/theme.js'

/**
 * Load theme file paths from the filesystem.
 * Searches kenv/themes for custom themes and kit/themes for built-in themes.
 *
 * @param kenvPath - Function to resolve kenv paths
 * @param kitPath - Function to resolve kit paths
 * @returns Object containing arrays of custom, built-in, and default theme paths
 *
 * @example
 * ```ts
 * const paths = await loadThemePaths(kenvPath, kitPath)
 * console.log(paths.custom)   // ['/Users/.../kenv/themes/my-theme.css']
 * console.log(paths.defaults) // ['/Users/.../kit/themes/script-kit-dark.css']
 * ```
 */
export async function loadThemePaths(
  kenvPath: (...args: string[]) => string,
  kitPath: (...args: string[]) => string
): Promise<ThemePaths> {
  // Normalize paths for cross-platform compatibility (Windows backslash issue)
  const customPattern = kenvPath('themes', '*.css').replaceAll('\\', '/')
  const builtInPattern = kitPath('themes', '*.css').replaceAll('\\', '/')
  const defaultExclude = `!${kitPath('themes', 'script-kit*.css').replaceAll('\\', '/')}`
  const defaultPattern = kitPath('themes', 'script-kit*.css').replaceAll('\\', '/')

  const [custom, builtIn, defaults] = await Promise.all([
    globby([customPattern]),
    globby([builtInPattern, defaultExclude]),
    globby([defaultPattern]),
  ])

  return { custom, builtIn, defaults }
}

/**
 * Options for building theme choices.
 */
export interface BuildThemeChoicesOptions {
  /** Theme paths from loadThemePaths */
  paths: ThemePaths
  /** Function to read file contents */
  readFile: (path: string, encoding: 'utf-8') => Promise<string>
  /** Node.js path module */
  pathModule: { basename: (p: string) => string }
  /** Function to set theme preview */
  setScriptTheme: (css: string) => void
  /** Markdown renderer */
  md: (content: string) => string
  /** Preview content (e.g., guide markdown) */
  previewContent: string
  /** Order of groups in the final list */
  groupOrder?: ThemeGroup[]
}

/**
 * Build a single theme choice object.
 *
 * @internal
 */
function buildThemeChoice(
  themePath: string,
  group: ThemeGroup,
  css: string,
  options: Pick<BuildThemeChoicesOptions, 'pathModule' | 'setScriptTheme' | 'md' | 'previewContent'>
): ThemeChoice {
  const themeName = options.pathModule.basename(themePath)

  return {
    group,
    name: themeName,
    description: themePath,
    value: themePath,
    enter: 'Apply Theme',
    preview: async () => {
      options.setScriptTheme(css)
      return options.md(`# Preview of ${themeName}\n\n${options.previewContent}`)
    },
  }
}

/**
 * Build theme choices from loaded paths.
 * Creates choice objects suitable for the arg() selector.
 *
 * @param options - Configuration for building choices
 * @returns Array of theme choices grouped by category
 *
 * @example
 * ```ts
 * const paths = await loadThemePaths(kenvPath, kitPath)
 * const guide = await readFile(kitPath('GUIDE.md'), 'utf-8')
 *
 * const choices = await buildThemeChoices({
 *   paths,
 *   readFile,
 *   pathModule: path,
 *   setScriptTheme,
 *   md,
 *   previewContent: guide,
 * })
 * ```
 */
export async function buildThemeChoices(
  options: BuildThemeChoicesOptions
): Promise<ThemeChoice[]> {
  const { paths, readFile, pathModule, setScriptTheme, md, previewContent } = options
  const choices: ThemeChoice[] = []

  // Process defaults first
  for (const themePath of paths.defaults) {
    const css = await readFile(themePath, 'utf-8')
    choices.push(
      buildThemeChoice(themePath, 'Default', css, {
        pathModule,
        setScriptTheme,
        md,
        previewContent,
      })
    )
  }

  // Process built-in themes
  for (const themePath of paths.builtIn) {
    const css = await readFile(themePath, 'utf-8')
    choices.push(
      buildThemeChoice(themePath, 'Built-in', css, {
        pathModule,
        setScriptTheme,
        md,
        previewContent,
      })
    )
  }

  // Process custom themes
  for (const themePath of paths.custom) {
    const css = await readFile(themePath, 'utf-8')
    choices.push(
      buildThemeChoice(themePath, 'Custom', css, {
        pathModule,
        setScriptTheme,
        md,
        previewContent,
      })
    )
  }

  return choices
}

/**
 * Extract the theme name from CSS content.
 *
 * @param css - Raw CSS string
 * @returns Theme name or undefined if not found
 *
 * @example
 * ```ts
 * const css = ':root { --name: "My Theme"; }'
 * const name = extractThemeName(css) // "My Theme"
 * ```
 */
export function extractThemeName(css: string): string | undefined {
  const match = /--name:\s*"([^"]+)"/.exec(css)
  return match?.[1]
}

/**
 * Replace the theme name in CSS content.
 *
 * @param css - Raw CSS string
 * @param newName - New theme name
 * @returns Updated CSS string
 *
 * @example
 * ```ts
 * const css = ':root { --name: "Old Name"; }'
 * const updated = replaceThemeName(css, "New Name")
 * // ':root { --name: "New Name"; }'
 * ```
 */
export function replaceThemeName(css: string, newName: string): string {
  return css.replace(/--name:\s*"[^"]*";/g, `--name: "${newName}";`)
}

/**
 * Convert a theme name to a valid filename slug.
 *
 * @param name - Theme display name
 * @returns Lowercase, hyphenated filename (without extension)
 *
 * @example
 * ```ts
 * slugifyThemeName("My Cool Theme!")  // "my-cool-theme-"
 * slugifyThemeName("Dark Mode v2")    // "dark-mode-v2"
 * ```
 */
export function slugifyThemeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
}
