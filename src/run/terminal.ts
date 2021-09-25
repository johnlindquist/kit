import os from "os"
import { config } from "dotenv"
import { assignPropsTo } from "../core/utils.js"

await import("../api/global.js")
await import("../api/kit.js")
await import("../api/lib.js")

let platform = os.platform()
try {
  await import(`../platform/${platform}.js`)
} catch (error) {
  // console.log(`No ./platform/${platform}.js`)
}

config({
  path: process.env.KIT_DOTENV || kenvPath(".env"),
})

await import("../target/terminal.js")
let { runCli } = await import("../cli/kit.js")

assignPropsTo(process.env, global.env)

await runCli()
