/** @type {import("/Users/johnlindquist/.kit")} */

await import("../test/config.js")
console.log({ kenvTestPath })

if (test("-d", kenvTestPath)) {
  console.log(`Clearing ${kenvTestPath}`)
  await rm(kenvTestPath)
}
await degit(`johnlindquist/kenv-test`).clone(kenvTestPath)

process.env.KENV = kenvTestPath
await $`kit ${kitPath("cli", "refresh-scripts-db.js")}`

export {}
