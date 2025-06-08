import { exec, writeFile, ensureDir } from "../src/globals/index"
import shelljs from "shelljs"
import { homedir } from "node:os"
import path from "node:path"

let { cp } = shelljs

let kitPath = (...pathParts) =>
	path.resolve(process.env.KIT || path.resolve(homedir(), ".kit"), ...pathParts)

cp("-R", "./root/.", kitPath())
cp("-R", "./build", kitPath())
cp("-R", "./src/types", kitPath())

cp("*.md", kitPath())
cp(".npmrc", kitPath())
cp("package*.json", kitPath())
cp("LICENSE", kitPath())

console.log(`Building ESM to ${kitPath()}`)
let esm = exec(`npx tsc --project ./tsconfig.json --outDir ${kitPath()}`)

console.log(`Building declarations to ${kitPath()}`)
let dec = exec(
	`npx tsc --project ./tsconfig-declaration.json --outDir ${kitPath()}`
)

let options = {
	cwd: kitPath()
}

const { default: download } = await import("./download")

try {
	const docsBuffer = await download("https://www.scriptkit.com/api/docs")
	await writeFile(kitPath("data", "docs.json"), docsBuffer)
} catch (e) {
	console.error(e)
}

try {
	console.log("Download hot")

	const hotBuffer = await download("https://www.scriptkit.com/api/hot")
	await writeFile(kitPath("data", "hot.json"), hotBuffer)
} catch (e) {
	console.error(e)
}
await Promise.all([esm, dec])

console.log(`Write .kitignore`)
await writeFile(kitPath(".kitignore"), "*")
