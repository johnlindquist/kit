import os from "os"
import { config } from "dotenv"
import { assignPropsTo } from "../core/utils.js"

import "../api/global.js"
import "../api/kit.js"
import "../api/lib.js"

let platform = os.platform()
try {
  await import(`../platform/${platform}.js`)
} catch (error) {
  // console.log(`No ./platform/${platform}.js`)
}

import "../target/terminal.js"
import { runCli } from "../cli/kit.js"

config({
  path: process.env.KIT_DOTENV || kenvPath(".env"),
})

assignPropsTo(process.env, global.env)

await runCli()
