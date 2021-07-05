import { resolve } from "path"
import { config } from "dotenv"
import { assignPropsTo, home } from "kit-bridge/esm/util"

import "./api/global.js"
import "./api/kit.js"
import "./api/lib.js"
import "./os/mac.js"
import "./target/terminal.js"

config({
  path: resolve(process.env.KENV || home(".kenv", ".env")),
})

assignPropsTo(process.env, global.env)

let script = await arg("Path to script:")
await run(script)
