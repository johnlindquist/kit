process.env.KIT_TARGET = "github-workflow"

import os from "node:os"
import { randomUUID } from "node:crypto"
import { pathToFileURL } from "node:url"

process.env.KIT_CONTEXT = "workflow"

// Parse combined script and args from GitHub Actions
// The GitHub action may pass "script arg1 arg2" as a single argument
// We need to split this before terminal.js processes the args
if (process.argv[2]?.includes(' ') && !process.argv[2].startsWith('-')) {
  // Split the first argument if it contains spaces (e.g., "test-ts John")
  const parts = process.argv[2].split(' ')
  // Replace process.argv with the split arguments
  process.argv = [
    process.argv[0], // node
    process.argv[1], // github-workflow.ts
    ...parts,        // script name and args split out
    ...process.argv.slice(3) // any remaining args like --trust
  ]
}

import {
  configEnv,
  resolveToScriptPath,
  kitPath,
} from "../core/utils.js"

const kitImport = async (...pathParts: string[]) =>
  await import(
    `${pathToFileURL(kitPath(...pathParts)).href}?uuid=${randomUUID()}`
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


const platform = process.env?.PLATFORM || os.platform()

await kitImport("platform", `${platform}.js`)

configEnv()

await kitImport("target", "terminal.js")

global.core = await npm("@actions/core")
global.github = await npm("@actions/github")

const scriptPath = resolveToScriptPath(
  await arg("Path to script")
)
await run(scriptPath)
