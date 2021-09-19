await import("../test/config.js")

if (test("-d", kitMockPath())) {
  await rm(kitMockPath())
}

process.env.KENV = home(".kenv")
await $`k ${kitPath("cli", "refresh-scripts-db.js")}`

export {}
