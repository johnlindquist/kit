// These ./bin files are customized for stackblitz
// A local Script Kit install works a little differently

import path from "path"

process.env.KIT = path.resolve(
  "node_modules",
  "@johnlindquist",
  "kit"
)
process.env.KENV = path.resolve()

import { configEnv } from "@johnlindquist/kit/core/utils"

await import("@johnlindquist/kit/api/global")
await import("@johnlindquist/kit/api/kit")
await import("@johnlindquist/kit/api/lib")

await import(`@johnlindquist/kit/platform/stackblitz`)

configEnv()

await import("@johnlindquist/kit/target/terminal")
await import("../scripts/{{command}}.js")
