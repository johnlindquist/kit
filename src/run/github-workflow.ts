import os from "os"
import { pathToFileURL } from "url"
import {
  configEnv,
  resolveToScriptPath,
} from "../core/utils.js"

let relativeImport = async (filePath: string) =>
  await import(
    pathToFileURL(filePath).href + "?uuid=" + global.uuid()
  )

await relativeImport("../api/global.js")
await relativeImport("../api/kit.js")
await relativeImport("../api/lib.js")

let platform = process.env?.PLATFORM || os.platform()

await relativeImport(`../platform/${platform}.js`)

configEnv()

await relativeImport("../target/terminal.js")

global.core = await npm("@actions/core")
global.github = await npm("@actions/github")

await relativeImport(
  resolveToScriptPath(await arg("Path to script"))
)
