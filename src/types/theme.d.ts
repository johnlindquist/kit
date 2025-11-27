/**
 * Theme type definitions for Script Kit.
 * Provides type safety for CSS variables, appearance modes, and theme structures.
 */

/**
 * Appearance mode for the application.
 * - 'light': Light color scheme
 * - 'dark': Dark color scheme
 * - 'auto': Follow system preference
 */
export type Appearance = 'light' | 'dark' | 'auto';

/**
 * Theme group categories for organizing themes in the selector.
 */
export type ThemeGroup = 'Kit' | 'Default' | 'Custom' | 'Built-in';

/**
 * CSS custom property names used in Script Kit themes.
 * These are the required and optional variables that themes can define.
 */
export type ThemeCSSVariable =
  // Metadata
  | '--name'
  | '--appearance'
  // Platform-specific opacity
  | '--opacity'
  | '--opacity-mac'
  | '--opacity-win'
  | '--opacity-other'
  // Core colors
  | '--color-text'
  | '--color-primary'
  | '--color-secondary'
  | '--color-background'
  // UI opacity
  | '--ui-bg-opacity'
  | '--ui-border-opacity'
  // Fonts
  | '--mono-font'
  | '--sans-font'
  | '--serif-font';

/**
 * Required CSS variables that every theme must define.
 */
export const REQUIRED_THEME_VARIABLES: readonly ThemeCSSVariable[] = [
  '--appearance',
  '--color-text',
  '--color-primary',
  '--color-secondary',
  '--color-background',
] as const;

/**
 * Platform identifiers for opacity resolution.
 */
export type ThemePlatform = 'mac' | 'win' | 'other';

/**
 * Parsed theme metadata extracted from CSS.
 */
export interface ParsedTheme {
  /** Display name of the theme */
  name: string;
  /** Light or dark appearance */
  appearance: Appearance;
  /** Raw CSS string */
  css: string;
  /** File path of the theme */
  path: string;
}

/**
 * Theme choice structure for the theme selector UI.
 */
export interface ThemeChoice {
  /** Theme group category */
  group: ThemeGroup;
  /** Display name */
  name: string;
  /** File path description */
  description: string;
  /** Path value for selection */
  value: string;
  /** Enter button text */
  enter: string;
  /** Preview function */
  preview: () => Promise<string>;
}

/**
 * Result of loading theme paths from the filesystem.
 */
export interface ThemePaths {
  /** User custom themes from kenv/themes */
  custom: string[];
  /** Built-in themes (excluding defaults) */
  builtIn: string[];
  /** Default Script Kit themes */
  defaults: string[];
}

/**
 * Result of theme validation.
 */
export interface ThemeValidationResult {
  /** Whether the theme is valid */
  valid: boolean;
  /** List of missing required CSS variables */
  missing: ThemeCSSVariable[];
  /** Warnings (non-blocking issues) */
  warnings: string[];
}
