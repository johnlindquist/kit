process.env.KIT_TARGET = "github-workflow"

import os from "node:os"
import { randomUUID } from "node:crypto"
import { pathToFileURL } from "node:url"
import * as core from "@actions/core"
import * as github from "@actions/github"

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

global.core = core
global.github = github

let scriptPath = resolveToScriptPath(
  await arg("Path to script")
)
await run(scriptPath)
