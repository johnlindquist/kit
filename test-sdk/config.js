import path from "node:path"
import os from "node:os"
import { pathToFileURL } from "node:url"

process.env.KIT = process.env.KIT || path.resolve(os.homedir(), ".kit")

let importKit = async (...parts) => {
	let partsPath = path.resolve(process.env.KIT, ...parts)
	await import(pathToFileURL(partsPath).href)
}

await importKit("api/global.js")
await importKit("api/kit.js")
await importKit("api/lib.js")

// On Windows CI, avoid importing the interactive terminal target to prevent TTY hangs
const isWindowsCI = process.platform === "win32" && !!process.env.CI
if (!isWindowsCI) {
	await importKit("target/terminal.js")
} else {
	// If any test truly needs the app runtime, it forks KIT_APP_PROMPT explicitly.
	console.log("[Test Setup] Skipping terminal.js import on Windows CI")
}

await importKit("platform/base.js")

let platform = os.platform()
try {
	await importKit(`platform/${platform}.js`)
} catch (error) {
	// console.log(`No ./platform/${platform}.js`)
}

// Safety: in non-TTY CI environments, some libs call setRawMode unguarded.
// Make it a no-op when stdin is not a TTY to avoid surprises.
try {
	if (!process.stdin.isTTY && typeof process.stdin.setRawMode === "function") {
		process.stdin.setRawMode = () => {}
	}
} catch {
	/* no-op */
}

export let kitMockPath = (...parts) =>
	path.resolve(home(".kit-mock-path"), ...parts)

export let kenvTestPath = kitMockPath(".kenv-test")
export let kenvSetupPath = kitMockPath(".kenv-setup")

process.env.KENV = kenvTestPath

/** @type {import("../src/core/utils.js")} */
let { KIT_APP, KIT_APP_PROMPT, KIT_FIRST_PATH } = await import(
	pathToFileURL(path.resolve(`${process.env.KIT}`, "core", "utils.js")).href
)
/** @type {import("../src/core/enum.js")} */
let { Channel } = await import(
	pathToFileURL(path.resolve(`${process.env.KIT}`, "core", "enum.js")).href
)

process.env.PATH = KIT_FIRST_PATH

let execOptions = {
	env: {
		PATH: KIT_FIRST_PATH
	}
}
global.kenvTestPath = kenvTestPath
global.kenvSetupPath = kenvSetupPath
global.kitMockPath = kitMockPath
global.execOptions = execOptions

let testScript = async (name, content, type = "js") => {
	await exec(`kit new ${name} main --no-edit`, {
		env: {
			...process.env,
			KIT_NODE_PATH: process.execPath,
			KIT_MODE: type
		}
	})

	let scriptPath = kenvPath("scripts", `${name}.js`)
	await appendFile(scriptPath, content)

	let { stdout, stderr } = await exec(`${kenvPath("bin", name)} --trust`)

	return { stdout, stderr, scriptPath }
}

global.testScript = testScript

export { Channel, KIT_APP, KIT_APP_PROMPT, testScript }
