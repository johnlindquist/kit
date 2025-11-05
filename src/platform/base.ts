/**
 * Platform-agnostic utilities for external application launching
 * Provides clean environment handling for VS Code, terminals, and other apps
 */

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

export {}
