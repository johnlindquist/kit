/** @type {import("/Users/johnlindquist/.kit")} */

import { pathToFileURL } from "node:url"
import { rimraf } from "rimraf"

async function importRelativePath(relativePath) {
	const path = await import("node:path")
	const { fileURLToPath, pathToFileURL } = await import("node:url")
	const __filename = fileURLToPath(import.meta.url)
	const __dirname = path.dirname(__filename)
	const absolutePath = path.join(__dirname, relativePath)
	const fileURL = pathToFileURL(absolutePath).href
	return import(fileURL)
}

await importRelativePath("../test-sdk/config.js")
console.log({ kenvTestPath })

let escapePathPeriods = (p) => p.replace(/\./g, "\\.")

let userKenv = (...parts) => {
	return pathToFileURL(home(".kenv", ...parts.filter(Boolean))).href
}
let userBinPath = userKenv("bin")
if (await isDir(userBinPath)) {
	let staleMocks = userKenv("bin", "mock*")
	console.log(`Removing stale mocks: ${staleMocks}`)
	await rimraf(escapePathPeriods(staleMocks))
}

if (await isDir(kitMockPath())) {
	await rimraf(escapePathPeriods(kitMockPath()))
}

if (await isDir(kenvTestPath)) {
	console.log(`Clearing ${kenvTestPath}`)
	await rimraf(escapePathPeriods(kenvTestPath))
}

let { stdout: branch, stderr } = await exec("git branch --show-current")

if (stderr || !branch.match(/main|beta|alpha|next/)) exit(1)

branch = branch.trim()
let repo = `johnlindquist/kenv#${branch}`

console.log(`Cloning ${repo} to ${kenvTestPath}`)

await degit(repo, {
	force: true
}).clone(kenvTestPath)

console.log(`Cloning ${repo} to ${kenvSetupPath}`)

await degit(repo, {
	force: true
}).clone(kenvSetupPath)

console.log({ kitPath: kitPath() })

process.env.KENV = kenvTestPath

console.log({ kitPath: kitPath() })
await rimraf(escapePathPeriods(kitPath("db", "scripts.json")))
const { stdout: setupStdout, stderr: setupStderr } = await exec(
	`kit "${kitPath("setup", "setup.js")}" --no-edit`
)
console.log({ setupStdout })
if (setupStderr) {
	console.log({ setupStderr })
	exit(1)
}
// console.log(
//   await readFile(kenvPath("package.json"), "utf-8")
// )
const { stdout: refreshScriptsDbStdout, stderr: refreshScriptsDbStderr } =
	await exec(`kit "${kitPath("cli", "refresh-scripts-db.js")}"`)
console.log({ refreshScriptsDbStdout })
if (refreshScriptsDbStderr) {
	console.log({ refreshScriptsDbStderr })
	exit(1)
}

export {}
