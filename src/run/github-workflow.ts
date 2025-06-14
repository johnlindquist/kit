process.env.KIT_TARGET = "github-workflow"

import os from "node:os"
import { randomUUID } from "node:crypto"
import { pathToFileURL } from "node:url"

process.env.KIT_CONTEXT = "workflow"

import {
  configEnv,
  resolveToScriptPath,
  kitPath,
} from "../core/utils.js"

let kitImport = async (...pathParts: string[]) =>
  await import(
    pathToFileURL(kitPath(...pathParts)).href +
    "?uuid=" +
    randomUUID()
  )

await kitImport("api", "global.js")
await kitImport("api", "kit.js")
await kitImport("api", "lib.js")
await import("../platform/base.js")

try {
  await attemptImport(kenvPath('globals.ts'))
} catch (error) {
  log('No user-defined globals.ts')
}


let platform = process.env?.PLATFORM || os.platform()

await kitImport("platform", `${platform}.js`)

configEnv()

await kitImport("target", "terminal.js")

if (!args.includes("--trust")) {
  args.push("--trust")
}
global.core = await npm("@actions/core")
global.github = await npm("@actions/github")

let scriptPath = resolveToScriptPath(
  await arg("Path to script")
)
await run(scriptPath)
