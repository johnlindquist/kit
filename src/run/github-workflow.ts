import os from "os"
import {
  configEnv,
  resolveToScriptPath,
} from "../core/utils.js"

await import("../api/global.js")
await import("../api/kit.js")
await import("../api/lib.js")

let platform = process.env?.PLATFORM || os.platform()

await import(`../platform/${platform}.js`)

configEnv()

await import("../target/terminal.js")

global.core = await npm("@actions/core")
global.github = await npm("@actions/github")

await import(
  resolveToScriptPath(await arg("Path to script"))
)
