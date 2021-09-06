import { config } from "dotenv"
import { assignPropsTo } from "@core/util"
import { Channel } from "@core/enum"
import "./api/global.js"
import "./api/kit.js"
import "./api/lib.js"
import "./os/mac.js"
import "./target/app.js"

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
