import ava from "ava"
import os from "node:os"
import "../../test-sdk/config.js"
import { pathToFileURL } from "node:url"

/** @type {import("../core/utils")} */
let { isFile, KIT_FIRST_PATH } = await import(
	pathToFileURL(kitPath("core", "utils.js")).href
)

let KIT = kitPath()
let KENV = kenvTestPath

let kenvSetupMockPath = (...parts) => {
	return path.resolve(KENV, ...parts)
}

/** @type {import("child_process").SpawnSyncOptions} */
const options = {
	cwd: KIT,
	encoding: "utf-8",
	env: {
		KIT,
		KENV,
		NODE_PATH: process.execPath,
		PATH: KIT_FIRST_PATH
	}
}

ava.before(`Run setup script`, (t) => {
	const setupResult = spawnSync(`./script`, [`./setup/setup.js`], options)
})

ava.serial("env was created", async (t) => {
	let envPath = kenvSetupMockPath(".env")
	t.log({ envPath })
	let checkEnv = await isFile(envPath)
	let contents = await readFile(envPath, "utf-8")

	t.true(checkEnv, `env was created`)
	t.false(contents.includes("{{"), `Check if .env was compiled`)
})

ava.serial("kenv linked to kit", async (t) => {
	let pkg = await readJson(kenvSetupMockPath("package.json"))

	t.assert(
		pkg.devDependencies?.["@johnlindquist/kit"],
		"file:../.kit",
		`kenv linked to kit`
	)
})

ava.serial("kenv degit", async (t) => {
	let files = await readdir(kenvSetupMockPath())

	t.false(files.includes(".git"), ".git was removed from kenv")
})

ava.serial("chmod", async (t) => {
	if (process.platform === "win32") {
		t.pass("Skipping chmod test on Windows")
		return
	}

	let { access } = await import("node:fs/promises")
	let { constants } = await import("node:fs")

	let bins = ["scripts", "kar", "bin k", "bin kit", "bin sk"]

	for (let b of bins) {
		let binPath = kitPath(...b.split(" "))
		t.log(binPath)
		let result = await access(binPath, constants.X_OK)
		t.true(isUndefined(result), "bins can be executed")
	}
})

ava.serial("example script exists", async (t) => {
	t.truthy(await pathExists(kenvPath("scripts", "browse-scriptkit.js")))
})
