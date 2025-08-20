process.env.KIT_TARGET = "app-prompt"

import os from "os"
import {
  configEnv,
  getMainScriptPath,
  run,
} from "../core/utils.js"
import { Channel } from "../core/enum.js"
import { AppMessage } from "../types/kitapp.js"

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

process.title = `Kit Idle - Main Script`

configEnv()

process.once("beforeExit", () => {
  try {
    console.warn('[app-exit-diag] app-index BEFORE_EXIT sending')
    send(Channel.BEFORE_EXIT)
  } catch (e) {
    console.warn('[app-exit-diag] app-index send BEFORE_EXIT failed:', (e as any)?.message || e)
  }
})

log(
  `>>>>>>>>>>>>>>>>>>>>>>>>>  WAITING FOR PROMPT READY  <<<<<<<<<<<<<<<<<<<<<<<<<<<<`
)

let mainHandler = async (data: AppMessage) => {
  log({ data })
  if (data.channel === Channel.PROMPT_READY) {
    process.off("message", mainHandler)
    performance.mark("run")
    log(`>>>>>>>>>>>>>>>>>>
    
    
    
    
    
RUNNING MAIN SCRIPT    
    
    
    
    
    
    
    
    
    >>>>>>>>>>>>>>>>>>>>>>`)
    await run(getMainScriptPath())
  }
}
process.on("message", mainHandler)
