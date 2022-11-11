import path from "path"
import os from "os"

process.env.KIT =
  process.env.KIT || path.resolve(os.homedir(), ".kit")

process.env.KNODE =
  process.env.KNODE || path.resolve(os.homedir(), ".knode")

let importKit = async (...parts) =>
  await import(path.resolve(process.env.KIT, ...parts))

await importKit("api/global.js")
await importKit("api/kit.js")
await importKit("api/lib.js")
await importKit("target/terminal.js")

export let kitMockPath = (...parts) =>
  path.resolve(home(".kit-mock-path"), ...parts)

export let kenvTestPath = kitMockPath(".kenv-test")
export let kenvSetupPath = kitMockPath(".kenv-setup")

process.env.KENV = kenvTestPath

/** @type {import("../src/core/utils.js")} */
let { KIT_APP, KIT_APP_PROMPT, KIT_FIRST_PATH } =
  await import(
    path.resolve(`${process.env.KIT}`, "core", "utils.js")
  )
/** @type {import("../src/core/enum.js")} */
let { Channel } = await import(
  path.resolve(`${process.env.KIT}`, "core", "enum.js")
)

process.env.PATH = KIT_FIRST_PATH

let execOptions = {
  env: {
    PATH: KIT_FIRST_PATH,
  },
}
global.kenvTestPath = kenvTestPath
global.kenvSetupPath = kenvSetupPath
global.kitMockPath = kitMockPath
global.execOptions = execOptions

let testScript = async (name, content, type = "js") => {
  await $`KIT_MODE=${type} kit new ${name} main --no-edit`

  await appendFile(
    kenvPath("scripts", `${name}.js`),
    content
  )

  return await $`${kenvPath("bin", name)}`
}

global.testScript = testScript

export { Channel, KIT_APP, KIT_APP_PROMPT, testScript }
