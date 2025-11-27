import originalOpen, { openApp as originalOpenApp, type Options } from "@johnlindquist/open"
import { getCleanEnvForLaunch } from "../../platform/base.js"
import { spawn, execSync } from "node:child_process"
import { existsSync } from "node:fs"
import { join, basename } from "node:path"

/**
 * Gets the executable path inside a macOS .app bundle.
 * Uses PlistBuddy to read CFBundleExecutable from Info.plist.
 */
const getAppExecutable = (appPath: string): string | null => {
	if (!appPath.endsWith(".app")) {
		return null
	}

	const infoPlistPath = join(appPath, "Contents", "Info.plist")
	if (!existsSync(infoPlistPath)) {
		return null
	}

	try {
		// Use PlistBuddy to read the executable name from Info.plist
		const executableName = execSync(
			`/usr/libexec/PlistBuddy -c "Print :CFBundleExecutable" "${infoPlistPath}"`,
			{ encoding: "utf-8" }
		).trim()

		if (!executableName) {
			return null
		}

		const executablePath = join(appPath, "Contents", "MacOS", executableName)
		if (existsSync(executablePath)) {
			return executablePath
		}
	} catch {
		// Try to guess based on app name (common pattern)
		const appName = basename(appPath, ".app")
		const guessedPath = join(appPath, "Contents", "MacOS", appName)
		if (existsSync(guessedPath)) {
			return guessedPath
		}
	}

	return null
}

/**
 * Launches a macOS app by spawning its executable directly.
 * This ensures the app inherits our clean environment instead of getting
 * environment from launchd/Launch Services.
 *
 * The macOS `open -a` command uses Launch Services, which starts apps with
 * environment from launchd - NOT from the calling process. This is why
 * passing env to spawn('open', ...) doesn't work for GUI apps.
 */
const launchMacOSApp = (appPath: string, cleanEnv: Record<string, string>): void => {
	const executablePath = getAppExecutable(appPath)

	if (executablePath) {
		// Spawn the executable directly - it WILL inherit the clean environment
		const child = spawn(executablePath, [], {
			env: cleanEnv,
			detached: true,
			stdio: "ignore"
		})
		child.unref()
	} else {
		// Fallback: use open command (env won't be inherited, but at least it works)
		const child = spawn("open", ["-a", appPath], {
			env: cleanEnv,
			detached: true,
			stdio: "ignore"
		})
		child.unref()
	}
}

/**
 * Open a target (URL, file, or app) with a clean environment.
 *
 * For macOS .app bundles, this spawns the executable directly to ensure
 * the clean environment is inherited. For other targets (URLs, files),
 * it uses the original open package.
 */
const openWithCleanEnv = (target: string, options?: Options) => {
	const cleanEnv = getCleanEnvForLaunch()

	// Check if this is a macOS .app bundle
	if (process.platform === "darwin" && target.endsWith(".app") && existsSync(target)) {
		launchMacOSApp(target, cleanEnv)
		// Return a fake promise that resolves to a fake child process for API compatibility
		return Promise.resolve({
			pid: 0,
			unref: () => {},
			ref: () => {},
			kill: () => true
		} as unknown as ReturnType<typeof originalOpen>)
	}

	// For non-.app targets, use the original open package with clean env
	return originalOpen(target, {
		...options,
		env: cleanEnv
	})
}

/**
 * Open an app by name with a clean environment.
 *
 * For macOS, resolves the app name to a path and spawns the executable directly.
 */
const openAppWithCleanEnv = async (
	name: string | readonly string[],
	options?: Parameters<typeof originalOpenApp>[1]
) => {
	const cleanEnv = getCleanEnvForLaunch()

	if (process.platform === "darwin") {
		// Handle array of app names (try each until one works)
		const appNames = Array.isArray(name) ? name : [name]

		for (const appName of appNames) {
			// Common app locations on macOS
			const possiblePaths = [
				`/Applications/${appName}.app`,
				`/Applications/${appName}`,
				`/System/Applications/${appName}.app`,
				`/System/Applications/${appName}`,
				`${process.env.HOME}/Applications/${appName}.app`,
				`${process.env.HOME}/Applications/${appName}`
			]

			for (const appPath of possiblePaths) {
				if (existsSync(appPath) && appPath.endsWith(".app")) {
					launchMacOSApp(appPath, cleanEnv)
					return Promise.resolve({
						pid: 0,
						unref: () => {},
						ref: () => {},
						kill: () => true
					} as unknown as ReturnType<typeof originalOpenApp>)
				}
			}
		}
	}

	// Fallback to original openApp with clean env
	return originalOpenApp(name, {
		...options,
		env: cleanEnv
	} as Parameters<typeof originalOpenApp>[1])
}

;(global as any).open = openWithCleanEnv
global.openApp = openAppWithCleanEnv
