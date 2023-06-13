/** @type {import("/Users/johnlindquist/.kit")} */
await import("../test/config.js")
console.log({ kenvTestPath })

let userKenv = (...parts) => {
  return home(".kenv", ...parts.filter(Boolean))
}
let userBinPath = userKenv("bin")
if (await isDir(userBinPath)) {
  let staleMocks = userKenv("bin", "mock*")
  console.log(`Removing stale mocks: ${staleMocks}`)
  await rm(staleMocks)
}

if (await isDir("-d", kitMockPath())) {
  await rm(kitMockPath())
}

if (await isDir(kenvTestPath)) {
  console.log(`Clearing ${kenvTestPath}`)
  await rm(kenvTestPath)
}
let { stdout: branch, stderr } =
  await $`git branch --show-current`

if (stderr || !branch.match(/main|beta|alpha/)) exit(1)

branch = branch.trim()
let repo = `johnlindquist/kenv#${branch}`

console.log(`Cloning ${repo} to ${kenvTestPath}`)

await degit(repo, {
  force: true,
}).clone(kenvTestPath)

console.log(`Cloning ${repo} to ${kenvSetupPath}`)

await degit(repo, {
  force: true,
}).clone(kenvSetupPath)

process.env.KENV = kenvTestPath
await rm(kitPath("db", "scripts.json"))
await $`kit ${kitPath("setup", "setup.js")} --no-edit`
// console.log(
//   await readFile(kenvPath("package.json"), "utf-8")
// )
await $`kit ${kitPath("cli", "refresh-scripts-db.js")}`

export {}
