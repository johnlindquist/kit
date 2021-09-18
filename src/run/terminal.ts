import os from "os"
import fs from "fs-extra"
import { config } from "dotenv"
import {
  assignPropsTo,
  resolveToScriptPath,
} from "../core/utils.js"

import "../api/global.js"
import "../api/kit.js"
import "../api/lib.js"

let platform = os.platform()
try {
  await import(`../platform/${platform}.js`)
} catch (error) {
  console.log(`No utils for ${platform}}`)
}

import "../target/terminal.js"

config({
  path: process.env.KIT_DOTENV || kenvPath(".env"),
})

assignPropsTo(process.env, global.env)

let script = await arg("Path to script:")

let { scriptPath, requiresPkg } =
  resolveToScriptPath(script)

let parentDir = path.dirname(scriptPath)
let pkgPath = path.resolve(parentDir, "package.json")
let createPkg = requiresPkg && !test("-f", pkgPath)

if (createPkg) {
  await writeFile(
    pkgPath,
    JSON.stringify({
      name: "kit__tmp__module",
      type: "module",
    }),
    { flag: "wx" }
  )
}

await run(scriptPath)

if (createPkg) {
  await fs.remove(pkgPath)
}
