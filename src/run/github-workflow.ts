import os from "os"
import { configEnv } from "../core/utils.js"

await import("../api/global.js")
await import("../api/kit.js")
await import("../api/lib.js")

process.on("unhandledRejection", (reason, promise) => {
  console.error(
    "Unhandled Rejection at:",
    promise,
    "reason:",
    reason
  )
  process.exitCode = 1
})

process.on("uncaughtException", error => {
  console.error("Uncaught Exception:", error)
  process.exitCode = 1
})

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
  console.log(error)
  process.exitCode = 1
}
