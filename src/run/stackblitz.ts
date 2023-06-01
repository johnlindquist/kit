process.env.KIT_TARGET = "stackblitz"

import path from "path"

process.env.KIT = path.resolve(
  "node_modules",
  "@johnlindquist",
  "kit"
)
process.env.KENV = path.resolve()

import { configEnv } from "../core/utils.js"

await import("../api/global.js")
await import("../api/kit.js")
await import("../api/lib.js")

await import(`../platform/stackblitz.js`)

configEnv()

await import("../target/terminal.js")
let { runCli } = await import("../cli/kit.js")

await runCli()
