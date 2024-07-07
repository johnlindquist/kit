await import("../test-sdk/config.js")

if (test("-d", kitMockPath())) {
	await rm(kitMockPath())
}

process.env.KENV = home(".kenv")
await $`kit ${kitPath("cli", "refresh-scripts-db.js")}`

export {}
