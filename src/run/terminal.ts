process.env.KIT_CONTEXT = 'terminal'
process.env.KIT_TARGET = 'terminal'

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:')
  console.error(formatError(error))
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise)
  console.error('Reason:', formatError(reason))
})

function formatError(error) {
  if (error instanceof Error) {
    const lines = error.stack.split('\n')
    const filteredLines = lines.filter((line) => !line.includes('node_modules') && !isMinifiedCode(line))
    return filteredLines.join('\n')
  }
  return String(error)
}

function isMinifiedCode(line) {
  // This is a simple heuristic. Adjust as needed.
  return line.length > 200 || line.split(',').length > 10
}

import os from 'node:os'
import { configEnv } from '../core/utils.js'

await import('../api/global.js')
let { initTrace } = await import('../api/kit.js')
await initTrace()
await import('../api/lib.js')
await import('../platform/base.js')

let platform = process.env?.PLATFORM || os.platform()
try {
  await import(`../platform/${platform}.js`)
} catch (error) {
  // console.log(`No ./platform/${platform}.js`)
}

try {
  await attemptImport(kenvPath('globals.ts'))
} catch (error) {
  // log('No user-defined globals.ts')
}

if (process.env.KIT_MEASURE) {
  let { PerformanceObserver, performance } = await import('node:perf_hooks')
  let obs = new PerformanceObserver((list) => {
    let entry = list.getEntries()[0]
    log(`⌚️ [Perf] ${entry.name}: ${entry.duration}ms`)
  })
  obs.observe({ entryTypes: ['measure'] })
}
performance.mark('start')

configEnv()

await import('../target/terminal.js')
let { runCli } = await import('../cli/kit.js')

performance.mark('run')
await runCli()
trace.flush()
