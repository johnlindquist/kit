import { config } from "dotenv"
import { assignPropsTo } from "kit-bridge/esm/util"

import "./api/global.js"
import "./api/kit.js"
import "./api/lib.js"
import "./system/mac.js"
import "./target/terminal.js"

config({
  path: process.env.KIT_DOTENV || kenvPath(".env"),
})

assignPropsTo(process.env, global.env)

let script = await arg("Path to script:")
await run(script)
