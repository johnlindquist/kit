console.log(`⚠️ KIT:`, process.env.KIT)
console.log(
  `❤️ import.meta.url`,
  new URL(import.meta.url).pathname
)

if (!process.env?.KIT) {
  process.env.KIT = path.dirname(
    new URL(import.meta.url).pathname
  )
}

if (!process.env?.KENV) {
  process.env.KENV = process.cwd()
}

import { config } from "dotenv"
import { copyFileSync, existsSync } from "fs"
import { assignPropsTo } from "kit-bridge/esm/util"

import "./api/global.js"
import "./api/kit.js"
import "./api/lib.js"
import "./target/terminal.js"

config({
  path: process.env.KIT_DOTENV || kenvPath(".env"),
})

assignPropsTo(process.env, global.env)

export async function kit(command: string) {
  let [script, ...args] = command.split(" ")
  let file = `${script}.js`
  let tmpFilePath = kitPath("tmp", "scripts", file)
  if (!existsSync(tmpFilePath)) {
    copyFileSync(kenvPath("scripts", file), tmpFilePath)
  }

  return (await run(tmpFilePath, ...args)).default
}
