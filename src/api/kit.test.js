import ava from "ava"
import os from "node:os"
import "../../test-sdk/config.js"
import dotenv from "dotenv"
import { pathToFileURL } from "node:url"

let importKit = async (...parts) => {
	let partsPath = path.resolve(process.env.KIT, ...parts)
	return await import(pathToFileURL(partsPath).href)
}

/** @type {import("./utils")} */
await importKit("core", "utils.js")

ava.serial(`testing "run" is global`, async (t) => {
	if (process.platform === "win32") {
		t.pass(
			"skipping on windows. Need to figure why this is failing randomly on CI"
		)
		return
	}

	let otherScript = "mock-other-script"
	let mainScript = "mock-main-run-script"

	await exec(`kit new ${otherScript} main --no-edit`, {
		env: {
			...process.env,
			NODE_PATH: process.execPath,
			KIT_MODE: "js"
		}
	})
	await exec(`kit new ${mainScript} main --no-edit`, {
		env: {
			...process.env,
			NODE_PATH: process.execPath,
			KIT_MODE: "js"
		}
	})

	await appendFile(
		kenvPath("scripts", `${mainScript}.js`),
		`
    await run("${otherScript}")
    `
	)

	if (process.platform === "win32") {
		mainScript += ".cmd"
	}

	const executeScript = async () => {
		try {
			return await exec(`${kenvPath("bin", mainScript)}`)
		} catch (error) {
			if (process.platform === "win32") {
				await new Promise((resolve) => setTimeout(resolve, 5000))
				return await exec(`${kenvPath("bin", mainScript)}`)
			}
			throw error
		}
	}

	let { stdout, stderr } = await executeScript()

	t.log({
		stdout,
		stderr
	})

	t.is(stderr, "")
})

// TODO: Fix tmpPath on Windows
if(process.platform !== "win32") {
ava.serial("tmpPath generates a tmp path", async (t) => {
	let script = "mock-tmp-path"
	let file = "taco.txt"

	let { stdout, stderr } = await testScript(
		script,
		`
    console.log(tmpPath("${file}"))    
    `
	)

	t.true(await pathExists(kenvPath("tmp", script)))
	let result = pathToFileURL(stdout.trim()).href
	let testTmpPath = pathToFileURL(
		path.resolve(os.tmpdir(), "kit", script, file)
	).href
		t.log({ result, testTmpPath })
		t.is(result, testTmpPath)
		t.is(stderr, "")
	})
}

ava.serial("setEnvVar sets an environment variable", async (t) => {
	const key = "KIT_TEST_ENV_VAR"
	const value = "hello"

	const { setEnvVar } = await importKit("api", "kit.js")
	await setEnvVar(key, value)

	let kenvEnvPath = kenvPath(".env")
	let kenvEnv = dotenv.parse(await readFile(kenvEnvPath, "utf8"))

	t.is(kenvEnv[key], value)
})

ava.serial("getEnvVar gets an environment variable", async (t) => {
	let key = "KIT_TEST_ENV_VAR"
	let fallback = "default"
	let expectedValue = "hello"

	let { setEnvVar, getEnvVar } = await importKit("api", "kit.js")
	await setEnvVar(key, expectedValue)

	// Now we retrieve the environment variable
	let value = await getEnvVar(key, fallback)

	// Check if the retrieved value matches the expected value
	t.is(value, expectedValue)
})

ava.serial(
	"getEnvVar returns fallback if environment variable does not exist",
	async (t) => {
		let key = "NON_EXISTENT_ENV_VAR"
		let fallback = "default"

		let { getEnvVar } = await importKit("api", "kit.js")
		let value = await getEnvVar(key, fallback)

		// Check if the fallback value is returned
		t.is(value, fallback)
	}
)

ava.serial("toggleEnvVar toggles an environment variable", async (t) => {
	let key = "KIT_TEST_TOGGLE_VAR"
	let defaultValue = "true"

	// Import the methods

	/** @type {import("./kit.js")} */
	let result = await importKit("api", "kit.js")

	let { setEnvVar, toggleEnvVar, getEnvVar } = await importKit("api", "kit.js")

	// Set the environment variable to the default value
	await setEnvVar(key, defaultValue)

	let toggledValue = await getEnvVar(key, "")

	t.is(toggledValue, "true")

	// Toggle the environment variable
	await toggleEnvVar(key)

	// Retrieve the toggled value
	toggledValue = await getEnvVar(key, "")

	// Check if the value has been toggled from "true" to "false"
	t.is(toggledValue, "false")

	// Toggle again
	await toggleEnvVar(key)

	// Retrieve the value again
	toggledValue = await getEnvVar(key, "")

	// Check if the value has been toggled back to "true"
	t.is(toggledValue, "true")
})
