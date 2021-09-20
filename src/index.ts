export {}

process.env.KIT =
  process.env.KIT_OVERRIDE ||
  path.dirname(new URL(import.meta.url).pathname)

process.env.KENV = process.env.KENV || process.cwd()

import { config } from "dotenv"
import { assignPropsTo } from "./core/utils.js"

import "./api/global.js"
import "./api/kit.js"
import "./api/lib.js"
import "./target/terminal.js"

config({
  path: process.env.KIT_DOTENV || kenvPath(".env"),
})

assignPropsTo(process.env, global.env)

export { selectScript, selectKenv } from "./core/utils.js"
export { kit } from "./api/kit.js"

//codegen
