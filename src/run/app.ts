import { config } from "dotenv"
import { assignPropsTo } from "../core/utils.js"
import os from "os"

import "../api/global.js"
import "../api/kit.js"
import "../api/lib.js"
let platform = os.platform()
try {
  await import(`../platform/${platform}.js`)
} catch (error) {
  console.log(`No utils for ${platform}}`)
}
import "../target/app.js"

config({
  path: process.env.KIT_DOTENV || kenvPath(".env"),
})

assignPropsTo(process.env, global.env)

let script = await arg("Path to script:")
await run(script)
