import "@johnlindquist/globals"
import shelljs from "shelljs"
import path from "node:path"
import os from "node:os"
import { homedir, platform } from "node:os"
import { existsSync } from "node:fs"
import { rimraf } from "rimraf"

let knodeVersion = "20.11.1"

let originalDir = process.cwd()

let { cd, cp } = shelljs

let kitPath = (...pathParts) =>
	path.resolve(process.env.KIT || path.resolve(homedir(), ".kit"), ...pathParts)

let knodePath = (...parts) =>
	path.join(
		process.env.KNODE || path.resolve(homedir(), ".knode"),
		...parts.filter(Boolean)
	)

// check npm and node versions
let options = {
	cwd: kitPath()
}
// Log which node is running this script using process.version and the node path
console.log(
	`build-kit and target node ${knodeVersion}
  
Running with ${process.argv[0]} version  ${process.version}
Path to this script: ${process.argv[1]}
  `
)

let extractNode = async (file) => {
	// Install node-stream-zip if it's not already installed
	if (!existsSync("node_modules/node-stream-zip")) {
		await exec("npm i node-stream-zip")
	}

	let { default: StreamZip } = await import("node-stream-zip")

	try {
		// eslint-disable-next-line
		const zip = new StreamZip.async({ file })
		const fileName = path.parse(file).name
		console.log(`Extacting ${fileName} to ${knodePath("bin")}`)
		// node-18.18.2-win-x64
		await zip.extract(fileName, knodePath("bin"))
		await zip.close()
	} catch (error) {
		console.error({ error })
	}
}

let installNodeWin = async () => {
	let arch = process.arch === "x64" ? "x64" : "x86"

	let url = `https://nodejs.org/dist/v${knodeVersion}/node-v${knodeVersion}-win-${arch}.zip`
	let buffer = await download(url)

	let nodeZipFilePath = path.join(os.tmpdir(), path.basename(url))
	console.log(`Downloaded ${url} to ${nodeZipFilePath}`)
	await writeFile(nodeZipFilePath, buffer)

	await extractNode(nodeZipFilePath)
}

let installNodeMac = async () => {
	let arch = process.arch === "x64" ? "x64" : "x86"
	await ensureDir(knodePath())
	let command = `./build/install-node.sh -v ${knodeVersion} -P '${knodePath()}' -y`
	console.log(command)
	await exec(command)
}

let installNode = async () => {
	let isWin = platform() === "win32"
	if (isWin) {
		await installNodeWin()
	} else {
		await installNodeMac()
	}
}

if (existsSync(kitPath())) {
	console.log(`Found kit at ${kitPath()}, removing...`)
	await rimraf(kitPath())
}
await ensureDir(kitPath())

let nodeExists = existsSync(knodePath("bin", "node"))
if (nodeExists) {
	console.log(`Found node at ${knodePath("bin", "node")}`)
	// Check node version
	let { stdout: nodeVersion } = await exec(
		`${knodePath("bin", "node")} --version`
	)
	console.log(
		`Current knode version: ${nodeVersion}. Required version ${knodeVersion}`
	)
	if (nodeVersion.endsWith(knodeVersion)) {
		console.log(`Version match. Skipping re-install.`)
	} else {
		await rimraf(knodePath(), { recursive: true, force: true })
		console.log(`Installing node to ${knodePath()}...`)

		await ensureDir(knodePath())
		await installNode()
	}
} else {
	console.log(`Couldn't find node at ${knodePath("bin", "node")}`)
	console.log(`Installing node to ${knodePath()}...`)

	await ensureDir(knodePath())
	await installNode()
}
await ensureDir(knodePath())

cp("-R", "./root/.", kitPath())
cp("-R", "./build", kitPath())
cp("-R", "./src/types", kitPath())

cp("*.md", kitPath())
cp("package*.json", kitPath())
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

let { stdout: nodeVersion } = await exec(
	`${knodePath("bin", "node")} --version`,
	options
)
let { stdout: npmVersion } = await exec(
	`${knodePath("bin", "npm")} --version`,
	options
)

console.log(`Node version: ${nodeVersion}`)
console.log(`NPM version: ${npmVersion}`)

console.log(`Building ESM to ${kitPath()}`)
let esm = exec(`npx tsc --outDir ${kitPath()}`).catch((e) => {
	console.error(e)
	process.exit(1)
})

await esm

console.log(`Building declarations to ${kitPath()}`)
let dec = exec(
	`${knodePath(
		"bin",
		"npx"
	)} tsc --project ./tsconfig-declaration.json --outDir ${kitPath()}`
).catch((e) => {
	console.error(e)
	process.exit(1)
})
await dec

console.log(`Install deps`)

await exec(`${knodePath("bin", "npm")} i --production`, options)

// console.log(`Install app deps`)
// await exec(`${npm} i @johnlindquist/kitdeps@0.1.1`)

console.log(`Download docs`)
await exec(
	`${knodePath("bin", "node")} ./run/terminal.js ./help/download-docs.js`,
	options
)

console.log(`Download hot`)
await exec(
	`${knodePath("bin", "node")} ./run/terminal.js ./hot/download-hot.js`,
	options
)

console.log(`Write .kitignore`)
await writeFile(kitPath(".kitignore"), "*")
cd(originalDir)
