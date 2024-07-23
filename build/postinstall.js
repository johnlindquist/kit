import path from "node:path"
import { rimraf } from "rimraf"
import { homedir, platform } from "node:os"
import { existsSync } from "node:fs"


let kitPath = (...pathParts) =>
	path.resolve(process.env.KIT || path.resolve(homedir(), ".kit"), ...pathParts)

console.log(`Run postinstall on ${kitPath()}`)

let binFileToRemove = platform() === "win32" ? "kit" : "kit.bat"

if(existsSync(kitPath("bin", binFileToRemove))){
    console.log(`Removing ${kitPath("bin", binFileToRemove)} so it doesn't interfere with kit.bat`)
	await rimraf(kitPath("bin", binFileToRemove))
}