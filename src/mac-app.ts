import { config } from "dotenv"
import { assignPropsTo } from "./core/util.js"

import "./api/global.js"
import "./api/kit.js"
import "./api/lib.js"
import "./os/mac.js"
import "./target/app.js"

config({
  path: process.env.KIT_DOTENV || kenvPath(".env"),
})

assignPropsTo(process.env, global.env)

let script = await arg("Path to script:")
await run(script)
