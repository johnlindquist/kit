import path from "path"
import os from "os"

process.env.KIT =
  process.env.KIT || path.resolve(os.homedir(), ".kit")

await import(path.resolve(`${process.env.KIT}`, "index.js"))
export let kenvTestPath = home(".kenv-test")

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
global.execOptions = execOptions

export { Channel, KIT_APP, KIT_APP_PROMPT }
