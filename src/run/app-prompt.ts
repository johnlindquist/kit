import os from "os"
import { configEnv, run } from "../core/utils.js"
import { Channel } from "../core/enum.js"

await import("../api/global.js")
await import("../api/kit.js")
await import("../api/pro.js")
await import("../api/lib.js")

let platform = os.platform()
try {
  await import(`../platform/${platform}.js`)
} catch (error) {
  // console.log(`No ./platform/${platform}.js`)
}

await import("../target/app.js")

let { script, args } = await new Promise<{
  script: string
  args: string[]
}>((resolve, reject) => {
  let messageHandler = data => {
    if (data.channel === Channel.VALUE_SUBMITTED) {
      process.off("message", messageHandler)
      resolve(data.value)
    }
  }
  process.on("message", messageHandler)
})

configEnv()

await run(script, ...args)
