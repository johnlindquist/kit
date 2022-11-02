import os from "os"
import { configEnv } from "../core/utils.js"

process.on("uncaughtException", error => {
  console.error(error)
  // process.exitCode = 1
})

process.on("unhandledRejection", error => {
  console.error(error)
  // process.exitCode = 1
})

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

try {
  await runCli()
} catch (error) {
  console.error(error)
  // process.exitCode = 1
}
