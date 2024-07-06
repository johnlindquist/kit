process.env.KIT_CONTEXT = "terminal"
process.env.KIT_TARGET = "terminal"

import os from "node:os"
import { configEnv } from "../core/utils.js"

await import("../api/global.js")
let { initTrace } = await import("../api/kit.js")
await initTrace()
await import("../api/lib.js")
await import("../platform/base.js")

let platform = process.env?.PLATFORM || os.platform()
try {
	await import(`../platform/${platform}.js`)
} catch (error) {
	// console.log(`No ./platform/${platform}.js`)
}

if (process.env.KIT_MEASURE) {
	let { PerformanceObserver, performance } = await import("node:perf_hooks")
	let obs = new PerformanceObserver((list) => {
		let entry = list.getEntries()[0]
		log(`⌚️ [Perf] ${entry.name}: ${entry.duration}ms`)
	})
	obs.observe({ entryTypes: ["measure"] })
}
performance.mark("start")

configEnv()

await import("../target/terminal.js")
let { runCli } = await import("../cli/kit.js")

performance.mark("run")
await runCli()
trace.flush()
