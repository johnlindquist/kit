import "@johnlindquist/globals"
import shelljs from "shelljs"
import path from "node:path"
import { homedir, platform } from "node:os"
import { existsSync } from "node:fs"
import { rimraf } from "rimraf"
import { chmod as fsChmod } from "node:fs/promises"

global.log = console.log
global.warn = console.warn
global.error = console.error
global.info = console.info

let kitPath = (...pathParts) =>
	path.resolve(process.env.KIT || path.resolve(homedir(), ".kit"), ...pathParts)

let options = {
	cwd: kitPath(),
	shell: true,
	stdio: "pipe"
}
process.on("uncaughtException", (error) => {
	console.error("Uncaught Exception:")
	console.error(formatError(error))
	process.exit(1)
})

process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled Rejection at:", promise)
	console.error("Reason:", formatError(reason))
})

function formatError(error) {
	if (error instanceof Error) {
		const lines = error.stack?.split("\n") || []
		const filteredLines = lines.filter(
			(line) => !line.includes("node_modules") && !isMinifiedCode(line)
		)
		return filteredLines.join("\n")
	}
	return String(error)
}

function isMinifiedCode(line) {
	// This is a simple heuristic. Adjust as needed.
	return line.length > 200 || line.split(",").length > 10
}

let originalDir = process.cwd()

let { cd, cp } = shelljs

// check npm and node versions

// Log which node is running this script using process.version and the node path
console.log(
	`build-kit
  
Running with ${process.argv[0]} version  ${process.version}
Path to this script: ${process.argv[1]}
  `
)

if (existsSync(kitPath())) {
	console.log(`Found kit at ${kitPath()}, removing...`)
	if (process.platform === "darwin") {
		await exec(`find ${kitPath()} -delete`)
	} else {
		await rimraf(kitPath())
	}
}
await ensureDir(kitPath())

cp("-R", "./root/.", kitPath())
cp("-R", "./build", kitPath())
cp("-R", "./src/types", kitPath())

cp(".npmrc", kitPath())
cp("*.md", kitPath())
cp("package*.json", kitPath())
cp("pnpm-lock.yaml", kitPath())
cp("LICENSE", kitPath())

// if src/editor/types/kit-editor.d.ts exists, copy it to kitPath('editor', 'types', 'kit-editor.d.ts')
const kitEditorDtsPath = path.resolve(
	"src",
	"editor",
	"types",
	"kit-editor.d.ts"
)
if (existsSync(kitEditorDtsPath)) {
	const editorTypesPath = kitPath("editor", "types", "kit-editor.d.ts")
	console.log(`Copying ${kitEditorDtsPath} to ${editorTypesPath}`)
	await ensureDir(path.dirname(editorTypesPath))
	cp(kitEditorDtsPath, editorTypesPath)
}

console.log(`Building ESM to ${kitPath()}`)
let esm = exec(`npx tsc --outDir ${kitPath()}`).catch((e) => {
	console.error(e)
	process.exit(1)
})

await esm

console.log(`Building declarations to ${kitPath()}`)
let dec = exec(
	`npx tsc --project ./tsconfig-declaration.json --outDir ${kitPath()}`
).catch((e) => {
	console.error(e)
	process.exit(1)
})
await dec

console.log("Install deps")
// await exec('npx pnpm node -p "process.execPath"', options)

await exec(`npx pnpm i --prod`, options)
// await exec(`npx pnpm dedupe --check`, options)
// await exec(`npx pnpm dedupe`, options)

// console.log(`Install app deps`)
// await exec(`${npm} i @johnlindquist/kitdeps@0.1.1`)

console.log("Download docs")

await ensureDir(kitPath("data"))
const { default: download } = await import("./download.ts")

try {
	const docsBuffer = await download("https://www.scriptkit.com/data/docs.json")
	await writeFile(kitPath("data", "docs.json"), docsBuffer)
} catch (e) {
	console.error(e)
}

try {
	console.log("Download hot")

	const hotBuffer = await download("https://www.scriptkit.com/data/hot.json")
	await writeFile(kitPath("data", "hot.json"), hotBuffer)
} catch (e) {
	console.error(e)
}

console.log("Write .kitignore")
await writeFile(kitPath(".kitignore"), "*")
cd(originalDir)

try {
	if (process.platform === "win32") {
		await Promise.all([fsChmod(kitPath("bin", "kit.bat"), 0o755)])
	} else {
		console.log(
			"Make script, kar, bin/k, bin/kit, bin/sk, and override/code/python executable"
		)
		await Promise.all([
			fsChmod(kitPath("script"), 0o755),
			fsChmod(kitPath("kar"), 0o755),
			fsChmod(kitPath("bin", "k"), 0o755),
			fsChmod(kitPath("bin", "kit"), 0o755),
			fsChmod(kitPath("bin", "sk"), 0o755),
			fsChmod(kitPath("override", "code", "python"), 0o755)
		])
	}
	process.exit(0)
} catch (e) {
	console.error(e)
	process.exit(1)
}
