import * as path from "path"
import { lstatSync } from "fs"

let dirExists = (dir: string) => {
  try {
    return lstatSync(dir, {
      throwIfNoEntry: false,
    })?.isDirectory()
  } catch (erorr) {
    return false
  }
}

if (dirExists(path.join(process.cwd(), "scripts"))) {
  process.env.KENV = path.join(process.cwd())
  process.env.KENV_PROJECT = "true"
}

import os from "os"
import { configEnv } from "../core/utils.js"

await import("../api/global.js")
await import("../api/kit.js")
await import("../api/lib.js")

let platform = process.env?.PLATFORM || os.platform()
try {
  await import(`../platform/${platform}.js`)
} catch (error) {
  // console.log(`No ./platform/${platform}.js`)
}

configEnv()

await import("../target/terminal.js")
let { runCli } = await import("../cli/kit.js")

await runCli()
