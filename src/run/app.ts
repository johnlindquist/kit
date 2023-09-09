process.env.KIT_TARGET = "app"

import { Channel } from "../core/enum.js"
import { configEnv, run } from "../core/utils.js"
import os from "os"

await import("../api/global.js")
await import("../api/kit.js")
await import("../api/pro.js")
await import("../api/lib.js")

let platform = os.platform()
try {
  await import(`../platform/${platform}.js`)
} catch (error) {
  // console.log(`No ./platform/${platform}.js`)
}
await import("../target/app.js")

configEnv()
process.title = `Kit Idle - App`
let script = await arg("Path to script:")
process.title = path.basename(script)

process.once("disconnect", () => {
  process.exit()
})

process.once("beforeExit", () => {
  send(Channel.BEFORE_EXIT)
})

await run(script)
