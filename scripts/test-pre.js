/** @type {import("/Users/johnlindquist/.kit")} */

await import("../test/config.js")
console.log({ kenvTestPath })

if (test("-d", kenvTestPath)) {
  console.log(`Clearing ${kenvTestPath}`)
  await rm(kenvTestPath)
}
let { stdout: branch, stderr } =
  await $`git branch --show-current`

if (stderr || !branch.match(/main|beta|alpha/)) exit(1)

await degit(`johnlindquist/kenv#${branch}`).clone(
  kenvTestPath
)

process.env.KENV = kenvTestPath
await $`kit ${kitPath("setup", "setup.js")} --no-edit`
await $`kit ${kitPath("cli", "refresh-scripts-db.js")}`

export {}
