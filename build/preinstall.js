import path from "node:path"
import { rimraf } from "rimraf"
import { platform } from "node:os"
import { existsSync } from "node:fs"

let isCI = process.env.CI === "true"
if (isCI) {
	console.log("Running in CI, skipping preinstall")
} else {
	let kitPath = (...pathParts) => path.resolve(process.cwd(), ...pathParts)

	if (platform() === "win32") {
		let binFileToRemove = "kit"
		let binFilePathToRemove = kitPath("bin", binFileToRemove)
		console.log(`Checking if ${binFilePathToRemove} exists...`)

		if (existsSync(binFilePathToRemove)) {
			console.log(
				`Removing ${kitPath("bin", binFileToRemove)} so it doesn't interfere with kit.bat`
			)
			await rimraf(kitPath("bin", binFileToRemove))
		} else {
			console.log(`${binFilePathToRemove} does not exist. Skipping...`)
		}
	}
}
