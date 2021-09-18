import os from "os"
import { config } from "dotenv"
import { assignPropsTo } from "../core/utils.js"
import { Channel } from "../core/enum.js"
import "../api/global.js"
import "../api/kit.js"
import "../api/lib.js"

let platform = os.platform()
try {
  await import(`../platform/${platform}.js`)
} catch (error) {
  console.log(`No utils for ${platform}}`)
}

import "../target/app.js"

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

config({
  path: process.env.KIT_DOTENV,
})

assignPropsTo(process.env, global.env)
await run(script, ...args)
