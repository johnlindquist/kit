process.env.KIT_CONTEXT = "terminal"
process.env.KIT_TARGET = "terminal"

import os from "os"
import { configEnv } from "../core/utils.js"

await import("../api/global.js")
let { initTrace } = await import("../api/kit.js")
await initTrace()
await import("../api/lib.js")
await import(`../platform/base.js`)

let platform = process.env?.PLATFORM || os.platform()
try {
  await import(`../platform/${platform}.js`)
} catch (error) {
  // console.log(`No ./platform/${platform}.js`)
}

configEnv()

await import("../target/terminal.js")
let { runCli } = await import("../cli/kit.js")

await runCli()
trace.flush()
