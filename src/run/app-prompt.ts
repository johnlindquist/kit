process.env.KIT_TARGET = 'app-prompt'
import { Channel, Trigger } from '../core/enum.js'
import os from 'node:os'
import { configEnv, run } from '../core/utils.js'

// TODO: Fix the types around accepting an early Scriptlet
let script: any = ''
let args = []
let tooEarlyHandler = (data) => {
  if (data.channel === Channel.VALUE_SUBMITTED) {
    script = data?.value?.scriptlet ? data?.value : data?.value?.script || data?.state?.value?.filePath
    args = data?.value?.args || data?.state?.value?.args || []
    global.headers = data?.value?.headers || {}

    // const value = `${process.pid}: ${
    //   data?.channel
    // }: ${script} ${performance.now()}ms`
    // process.send({
    //   channel: Channel.CONSOLE_LOG,
    //   value,
    // });
  }
}

process.send({
  channel: Channel.KIT_LOADING,
  value: 'app-prompt.ts'
})

process.on('message', tooEarlyHandler)

await import('../api/global.js')
let { initTrace } = await import('../api/kit.js')
await initTrace()
await import('../api/pro.js')
await import('../api/lib.js')
await import('../platform/base.js')

let platform = os.platform()

try {
  await import(`../platform/${platform}.js`)
} catch (error) {
  // console.log(`No ./platform/${platform}.js`)
}

await import('../target/app.js')

if (process.env.KIT_MEASURE) {
  let { PerformanceObserver, performance } = await import('node:perf_hooks')
  let obs = new PerformanceObserver((list) => {
    let entry = list.getEntries()[0]
    log(`⌚️ [Perf] ${entry.name}: ${entry.duration}ms`)
  })
  obs.observe({ entryTypes: ['measure'] })
}

try {
  await silentAttemptImport(kenvPath('globals.ts'))
} catch (error) {
  log('No user-defined globals.ts')
}

let trigger = ''
let name = ''
let result = null
let choices = []
let scriptlet = null
process.title = 'Kit Idle - App Prompt'
process.send({
  channel: Channel.KIT_READY,
  value: result
})

try {
  result = await new Promise((resolve, reject) => {
    process.off('message', tooEarlyHandler)

    if (script) {
      // process.send({
      //   channel: Channel.CONSOLE_LOG,
      //   value: `Too early ${tooEarly}...`,
      // })

      // TODO: Revisit what causes "too early" and the edge-cases here
      if (script?.scriptlet) {
        resolve(script)
        return
      }
      resolve({
        script,
        args,
        trigger: Trigger.Trigger
      })
      return
    }

    type MessageData = {
      channel: Channel
      value: any
    }

    let messageHandler = (data: MessageData) => {
      if (data.channel === Channel.HEARTBEAT) {
        send(Channel.HEARTBEAT)
      }
      if (data.channel === Channel.VALUE_SUBMITTED) {
        try {
          trace.instant({
            name: 'app-prompt.ts -> VALUE_SUBMITTED',
            args: { hasHeaders: !!data?.value?.headers, hasArgs: Array.isArray(data?.value?.args) }
          })
        } catch (e) {
          console.warn('[app-log] trace.instant failed in VALUE_SUBMITTED', (e as any)?.message || e)
        }
        global.headers = data?.value?.headers || {}
        process.off('message', messageHandler)
        resolve(data.value)
      }
    }
    process.on('message', messageHandler)
  })
} catch (e) {
  console.warn('[app-log] app-prompt main promise failed', (e as any)?.message || e)
  exit()
}
; ({ script, args, trigger, choices, name, scriptlet } = result)

process.env.KIT_TRIGGER = trigger

configEnv()
process.title = `Kit - ${path.basename(script)}`

process.once('beforeExit', () => {
  // Emit BEFORE_EXIT before tearing down tracing to avoid null deref
  try {
    console.warn('[app-exit-diag] app-prompt BEFORE_EXIT sending')
    send(Channel.BEFORE_EXIT)
  } catch (e) {
    console.warn('[app-exit-diag] send BEFORE_EXIT failed:', (e as any)?.message || e)
  }
  try {
    if (global?.trace?.flush) {
      global.trace.flush()
    }
  } catch (e) {
    console.warn('[app-exit-diag] trace.flush failed:', (e as any)?.message || e)
  } finally {
    try { (global as any).trace = null } catch { }
  }
})

performance.mark('run')

if (choices?.length > 0) {
  global.kitScript = scriptlet?.filePath
  let inputs: string[] = []

  if (choices[0].inputs?.length > 0) {
    inputs = await arg<string[]>(
      {
        name,
        scriptlet: true,
        resize: true,
        onEscape: () => {
          exit()
        }
      },
      choices
    )
  }
  let { runScriptlet } = await import('../main/scriptlet.js')
  updateArgs(args)
  try {
    global.log('[app-log] running scriptlet', { name, id: scriptlet?.id })
    await runScriptlet(scriptlet, inputs, flag)
    global.log('[app-log] finished scriptlet')
  } catch (e) {
    global.log('[app-log] runScriptlet failed', (e as any)?.message || e)
    throw e
  }
} else {
  if (script.includes('.md')) {
    log({ script, ugh: '❌' })
    exit()
  }
  try {
    global.log('[app-log] running script', { script, argsLen: args?.length || 0 })
    await run(script, ...args)
    global.log('[app-log] finished script')
  } catch (e) {
    global.log('[app-log] run(script) failed', (e as any)?.message || e)
    throw e
  }
}
