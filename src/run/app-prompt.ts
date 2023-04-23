import os from "os"
import {
  configEnv,
  run,
  kenvPath,
  createPathResolver,
} from "../core/utils.js"
import { Channel } from "../core/enum.js"

/*
- Force ~/.kit to ~/.kenv/node_modules/@johnlindquist/kit
- Your ~/.kenv/scripts have: import "@johnlindquist/kit" in them
- Those files will load from ~/.kenv/node_modules/@johnlindquist/kit due to the ~/.kenv/package.json
- If these files try to load from ~/.kit, they will duplicate the load causing some issues
- These imports are only here if you don't want to use import "@johnlindquist/kit", but if you do, they load twice if not loaded from the same dir
*/

let kenvKitPath = createPathResolver(
  kenvPath("node_modules", "@johnlindquist", "kit")
)

await import(kenvKitPath("api", "global.js"))
await import(kenvKitPath("api", "kit.js"))
await import(kenvKitPath("api", "pro.js"))
await import(kenvKitPath("api", "lib.js"))

let platform = os.platform()
try {
  await import(kenvKitPath("platform", `${platform}.js`))
} catch (error) {
  // console.log(`No ./platform/${platform}.js`)
}

await import(kenvKitPath("target", "app.js"))

let script = ""
let trigger = ""
let args = []
let result = null
process.title = `Kit Idle - App Prompt`
try {
  result = await new Promise<{
    script: string
    trigger: string
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
} catch (e) {
  global.warn(e)
  exit()
}

;({ script, args, trigger } = result)

process.env.KIT_TRIGGER = trigger

configEnv()
process.title = `Kit - ${path.basename(script)}`

await run(script, ...args)
