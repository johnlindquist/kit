process.env.KIT_TARGET = "app-prompt"
import { Channel, Trigger } from "../core/enum.js"

let script = ""
let tooEarlyHandler = data => {
  if (data.channel === Channel.VALUE_SUBMITTED) {
    script =
      data?.value?.script || data?.state?.value?.filePath
    const value = `${process.pid}: ${
      data?.channel
    }: ${script} ${performance.now()}ms`
    // process.send({
    //   channel: Channel.CONSOLE_LOG,
    //   value,
    // });
  }
}
process.on("message", tooEarlyHandler)
import os from "os"
import { configEnv, run } from "../core/utils.js"

await import("../api/global.js")
let { initTrace } = await import("../api/kit.js")
await initTrace()

await import("../api/pro.js")
await import("../api/lib.js")
await import(`../platform/base.js`)

let platform = os.platform()
try {
  await import(`../platform/${platform}.js`)
} catch (error) {
  // console.log(`No ./platform/${platform}.js`)
}

await import("../target/app.js")

if (process.env.KIT_MEASURE) {
  let { PerformanceObserver, performance } = await import(
    "perf_hooks"
  )
  let obs = new PerformanceObserver(list => {
    let entry = list.getEntries()[0]
    log(`⌚️ [Perf] ${entry.name}: ${entry.duration}ms`)
  })
  obs.observe({ entryTypes: ["measure"] })
}

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
    process.off("message", tooEarlyHandler)

    if (script) {
      // process.send({
      //   channel: Channel.CONSOLE_LOG,
      //   value: `Too early ${tooEarly}...`,
      // })
      resolve({
        script,
        args: [],
        trigger: Trigger.Trigger,
      })
      return
    }
    let messageHandler = data => {
      if (data.channel === Channel.HEARTBEAT) {
        send(Channel.HEARTBEAT)
      }
      if (data.channel === Channel.VALUE_SUBMITTED) {
        trace.instant({
          name: "app-prompt.ts -> VALUE_SUBMITTED",
          args: data,
        })
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

process.once("disconnect", () => {
  process.exit()
})

process.once("beforeExit", () => {
  send(Channel.BEFORE_EXIT)
})

performance.mark("run")
await run(script, ...args)
