import ava from "ava"
import os from "os"
import "../../test/config.js"

/** @type {import("../core/utils")} */
let { isFile, KIT_FIRST_PATH } = await import(
  kitPath("core", "utils.js")
)

let KIT = kitPath()
let KENV = kenvTestPath
let KNODE =
  process.env.KNODE || path.resolve(os.homedir(), ".knode")

let kenvSetupMockPath = (...parts) => {
  return path.resolve(KENV, ...parts)
}

/** @type {import("child_process").SpawnSyncOptions} */
const options = {
  cwd: KIT,
  encoding: "utf-8",
  env: {
    KIT,
    KENV,
    KNODE,
    PATH: KIT_FIRST_PATH,
  },
}

ava.before(`Run setup script`, t => {
  const setupResult = spawnSync(
    `./script`,
    [`./setup/setup.js`],
    options
  )
})

ava("env was created", async t => {
  let checkEnv = await isFile(kenvSetupMockPath(".env"))
  let contents = await readFile(
    kenvSetupMockPath(".env"),
    "utf-8"
  )

  t.true(checkEnv, `env was created`)
  t.false(
    contents.includes("{{"),
    `Check if .env was compiled`
  )
})

ava("kenv linked to kit", async t => {
  let pkg = await readJson(
    kenvSetupMockPath("package.json")
  )

  t.assert(
    pkg.devDependencies?.["@johnlindquist/kit"],
    "file:../.kit",
    `kenv linked to kit`
  )
})

ava("kenv degit", async t => {
  let files = await readdir(kenvSetupMockPath())

  t.false(
    files.includes(".git"),
    ".git was removed from kenv"
  )
})

ava("chmod", async t => {
  let { access } = await import("fs/promises")
  let { constants } = await import("fs")

  let bins = [
    "scripts",
    "kar",
    "bin k",
    "bin kit",
    "bin sk",
  ]

  for (let b of bins) {
    let binPath = kitPath(...b.split(" "))
    t.log(binPath)
    let result = await access(binPath, constants.X_OK)
    t.true(_.isUndefined(result), `bins can be executed`)
  }
})

ava("example script exists", async t => {
  t.truthy(
    await pathExists(
      kenvPath("scripts", "browse-scriptkit.js")
    )
  )
})
