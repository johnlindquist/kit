import path from "path"
import os from "os"

process.env.KIT =
  process.env.KIT || path.resolve(os.homedir(), ".kit")

await import(path.resolve(`${process.env.KIT}`, "run.js"))
export let kenvTestPath = home(".kenv-test")

process.env.KENV = kenvTestPath

/** @type {import("../src/core/util.js")} */
let { KIT_MAC_APP, KIT_MAC_APP_PROMPT, KIT_FIRST_PATH } =
  await import(
    path.resolve(`${process.env.KIT}`, "core", "util.js")
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
global.execOptions = execOptions

export { Channel, KIT_MAC_APP, KIT_MAC_APP_PROMPT }
