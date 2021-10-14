#!/usr/bin/env node

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

// let pkgJsonPath = path.resolve("package.json")

// let pkgJson = await readJson(pkgJsonPath)
// if (pkgJson) {
//   if (pkgJson?.type !== "module") {
//     let confirm = await arg(
//       `package.json "type" needs to be set to "module". Proceed?`,
//       [
//         { name: "No", value: false },
//         { name: "Yes", value: true },
//       ]
//     )

//     if (confirm) {
//       await writeJson(
//         pkgJsonPath,
//         {
//           type: "module",
//           ...pkgJson,
//         },
//         { spaces: "\t" }
//       )
//     } else {
//       exit()
//     }
//   }
// }

await runCli()
