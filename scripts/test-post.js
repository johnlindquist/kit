import { rimraf } from "rimraf"

await import("../test-sdk/config.js")

if (test("-d", kitMockPath())) {
	await rimraf(kitMockPath())
}

process.env.KENV = home(".kenv")
await exec(`kit ${kitPath("cli", "refresh-scripts-db.js")}`)
