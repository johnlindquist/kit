/**
 * Platform-agnostic utilities for external application launching
 * Provides clean environment handling for VS Code, terminals, and other apps
 */

import { existsSync, readFileSync } from "node:fs"
import { kenvPath } from "../core/resolvers.js"

// Cache for env keys to strip (parsed once from .env files)
let cachedEnvKeysToStrip: Set<string> | null = null

/**
 * Parses .env file content and returns the keys defined in it
 */
const parseEnvKeys = (content: string): string[] => {
	return content
		.split("\n")
		.filter((line) => {
			const trimmed = line.trim()
			return trimmed && !trimmed.startsWith("#") && trimmed.includes("=")
		})
		.map((line) => line.split("=")[0].trim())
		.filter(Boolean)
}

/**
 * Gets the set of environment variable keys defined in ~/.kenv/.env files
 * These are Script Kit secrets that should not leak to external applications
 */
const getEnvKeysToStrip = (): Set<string> => {
	if (cachedEnvKeysToStrip) {
		return cachedEnvKeysToStrip
	}

	const keysToStrip = new Set<string>()
	const envFiles = [".env", ".env.local", ".env.development", ".env.production", ".env.kit"]

	for (const file of envFiles) {
		try {
			const envPath = kenvPath(file)
			if (existsSync(envPath)) {
				const content = readFileSync(envPath, "utf-8")
				for (const key of parseEnvKeys(content)) {
					keysToStrip.add(key)
				}
			}
		} catch {
			// Ignore errors reading .env files
		}
	}

	// Also strip Kit-specific internal variables
	const kitInternalVars = [
		"KIT",
		"KENV",
		"KIT_CONTEXT",
		"KIT_MAIN_SCRIPT",
		"KIT_APP_PATH",
		"KIT_CLEAN_SHELL_ENV",
		"KIT_DOTENV_PATH",
		"KIT_ACCESSIBILITY",
		"KIT_TERMINAL",
		"KIT_EDITOR",
		"KIT_OPEN_IN",
		"PATH_FROM_DOTENV",
		"PARSED_PATH"
	]

	for (const key of kitInternalVars) {
		keysToStrip.add(key)
	}

	cachedEnvKeysToStrip = keysToStrip
	return keysToStrip
}

/**
 * Clears the cached env keys - useful for testing or when .env files change
 */
export const clearEnvKeysCache = (): void => {
	cachedEnvKeysToStrip = null
}

/**
 * Gets a clean shell environment for launching external applications
 *
 * This function returns the user's shell environment WITHOUT Script Kit's modifications.
 * External apps (VS Code, terminals, etc.) launched with this environment will behave
 * as if launched normally from the system, preventing package manager conflicts.
 *
 * The environment is cached at app startup and passed via KIT_CLEAN_SHELL_ENV.
 *
 * @returns Clean environment variables suitable for external application launches
 */
export const getCleanEnvForExternalApp = (): Record<string, string> => {
	// Try to read cached shell environment passed from the app
	if (process.env.KIT_CLEAN_SHELL_ENV) {
		try {
			const cleanEnv = JSON.parse(process.env.KIT_CLEAN_SHELL_ENV)
			return cleanEnv as Record<string, string>
		} catch (error) {
			// Fall through to fallback if JSON parse fails
			console.error("Failed to parse KIT_CLEAN_SHELL_ENV:", error)
		}
	}

	// Fallback: Build a minimal clean environment from whitelisted variables
	// This happens if the app didn't cache the shell env (shouldn't normally occur)
	const whitelist = [
		"HOME",
		"USER",
		"SHELL",
		"LANG",
		"LC_ALL",
		"TERM",
		"TMPDIR",
		"TMP",
		"TEMP",
		"EDITOR",
		"VISUAL",
		// Platform-specific
		"APPDATA", // Windows
		"LOCALAPPDATA", // Windows
		"USERPROFILE", // Windows
		"XDG_CONFIG_HOME", // Linux
		"XDG_DATA_HOME" // Linux
	]

	const cleanEnv: Record<string, string> = {}

	for (const key of whitelist) {
		if (process.env[key]) {
			cleanEnv[key] = process.env[key] as string
		}
	}

	// For PATH, use the original if available, otherwise use current
	// (This fallback won't be perfect but better than Kit's modified PATH)
	if (process.env.PATH) {
		cleanEnv.PATH = process.env.PATH
	}

	return cleanEnv
}

/**
 * Gets a clean environment for launching external applications
 *
 * This combines the clean shell environment (from user's shell config) with
 * explicit removal of any secrets/keys from ~/.kenv/.env files.
 *
 * This ensures that:
 * 1. External apps get the user's normal shell environment (PATH, LANG, etc.)
 * 2. Script Kit secrets (API keys, etc.) do NOT leak to external processes
 *
 * @returns Clean environment suitable for exec() calls that launch external apps
 */
export const getCleanEnvForLaunch = (): Record<string, string> => {
	// Start with the clean shell environment
	const baseEnv = getCleanEnvForExternalApp()

	// Get keys that should be stripped (from .env files and Kit internals)
	const keysToStrip = getEnvKeysToStrip()

	// Create final clean env by removing sensitive keys
	const cleanEnv: Record<string, string> = {}

	for (const [key, value] of Object.entries(baseEnv)) {
		if (!keysToStrip.has(key)) {
			cleanEnv[key] = value
		}
	}

	return cleanEnv
}
