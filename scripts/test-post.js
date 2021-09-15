await import("../test/config.js")

if (test("-d", kenvTestPath)) {
  await rm(kenvTestPath)
}

process.env.KENV = home(".kenv")
await $`k ${kitPath("cli", "refresh-scripts-db.js")}`

export {}
