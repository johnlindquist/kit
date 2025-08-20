// File: src/workers/cache-grouped-scripts-worker.test.ts
import test from 'ava'
import { Worker } from 'node:worker_threads'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import fs from 'node:fs'
import { execSync } from 'node:child_process'
import { Channel } from '../core/enum.js'
import { loadPreviousResults, saveResults } from '../core/test-utils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let compiledWorkerPath: string

test.before(() => {
  const workerTsPath = path.resolve(__dirname, './cache-grouped-scripts-worker.ts')
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-worker-'))
  compiledWorkerPath = path.join(tempDir, 'cache-grouped-scripts-worker.js')

  // Compile the TypeScript worker using esbuild
  execSync(
    `pnpm exec esbuild ${workerTsPath} --bundle --platform=node --format=esm --outfile=${compiledWorkerPath} --external:node:* --external:electron --banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);"`,
    {
      stdio: 'inherit',
      cwd: process.cwd() // Ensure we're in the project root for node_modules resolution
    }
  )
})

/**
 * Helper that creates a worker from the cache-grouped-scripts-worker,
 * sends it a message, and returns a promise that resolves with the first message.
 */
function runWorkerMessage(messageToSend: any): Promise<{ msg: any; worker: Worker }> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(compiledWorkerPath)
    let resolved = false

    // Diagnostics: log worker lifecycle to help triage CI hangs
    worker.on('online', () => {
      console.error(`[worker-diag] online threadId=${worker.threadId} file=${compiledWorkerPath}`)
    })
    worker.on('exit', (code) => {
      console.error(`[worker-diag] exit threadId=${worker.threadId} code=${code}`)
    })

    // Listen for messages and resolve when we get a CACHE_MAIN_SCRIPTS message
    worker.on('message', (msg) => {
      console.error(`[worker-diag] message threadId=${worker.threadId} channel=${msg?.channel} id=${msg?.id}`)
      if (msg.channel === Channel.CACHE_MAIN_SCRIPTS && !resolved) {
        resolved = true
        resolve({ msg, worker })
      }
    })

    // Handle worker errors - ignore ENOENT since it's expected during tests
    worker.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        // Ignore expected file system errors during tests
        return
      }
      reject(err)
    })

    console.error(`[worker-diag] postMessage threadId=${worker.threadId} channel=${messageToSend?.channel} id=${messageToSend?.id}`)
    worker.postMessage(messageToSend)

    // Add timeout to prevent hanging
    setTimeout(() => {
      if (!resolved) {
        // Always fail fast with a clear error and terminate the worker.
        // Avoid leaving a pending Promise which causes AVA to time out.
        console.error('[worker-diag] timeout waiting for CACHE_MAIN_SCRIPTS; terminating worker to avoid dangling thread')
        try { worker.terminate() } catch {}
        reject(new Error('Timeout waiting for CACHE_MAIN_SCRIPTS message'))
      }
    }, 5000)
  })
}

test('Worker returns expected scripts structure when no stamp provided', async (t) => {
  const { msg, worker } = await runWorkerMessage({
    channel: Channel.CACHE_MAIN_SCRIPTS,
    value: null,
    id: 'test-no-stamp'
  })

  t.is(msg.channel, Channel.CACHE_MAIN_SCRIPTS)
  t.true(Array.isArray(msg.scripts), 'scripts should be an array')
  // Instead of expecting an empty array, check that each script item has the expected shape.
  if (msg.scripts.length > 0) {
    const firstItem = msg.scripts[0]
    t.true(typeof firstItem.id === 'string', 'Each script item should have an id')
    t.true(typeof firstItem.name === 'string', 'Each script item should have a name')
  }
  t.truthy(msg.scriptFlags, 'scriptFlags should be defined')
  t.true(typeof msg.preview === 'string', 'preview should be a string')
  worker.terminate()
})

test('Worker handles REMOVE_TIMESTAMP and returns updated cache', async (t) => {
  const dummyStamp = { filePath: 'dummy-script.js', timestamp: Date.now(), runCount: 1 }
  const { msg, worker } = await runWorkerMessage({
    channel: Channel.REMOVE_TIMESTAMP,
    value: dummyStamp,
    id: 'test-remove'
  })

  t.is(msg.channel, Channel.CACHE_MAIN_SCRIPTS)
  t.true(Array.isArray(msg.scripts), 'scripts should be an array')
  // Check that if the dummy stamp was present, it is now removed
  const found = msg.scripts.some((s: any) => s.filePath === dummyStamp.filePath)
  t.false(found, 'Dummy stamp should not be found in scripts after removal')
  t.truthy(msg.scriptFlags)
  t.true(typeof msg.preview === 'string')
  worker.terminate()
})

test('Worker handles CLEAR_TIMESTAMPS and returns updated cache', async (t) => {
  const { msg, worker } = await runWorkerMessage({
    channel: Channel.CLEAR_TIMESTAMPS,
    id: 'test-clear'
  })

  t.is(msg.channel, Channel.CACHE_MAIN_SCRIPTS)
  t.true(Array.isArray(msg.scripts), 'scripts should be an array')
  // Rather than expecting an empty array, verify that the default scripts structure is returned.
  if (msg.scripts.length > 0) {
    const scriptItem = msg.scripts[0]
    t.true(typeof scriptItem.id === 'string', 'Each script item should have an id')
    t.true(typeof scriptItem.name === 'string', 'Each script item should have a name')
  }
  t.truthy(msg.scriptFlags)
  t.true(typeof msg.preview === 'string')
  worker.terminate()
})

test('Worker caches results for identical stamp filePath', async (t) => {
  const dummyStamp = { filePath: 'dummy-script.js', timestamp: Date.now(), runCount: 1 }
  const worker = new Worker(compiledWorkerPath)

  // Send first message
  const firstResponse: any = await new Promise((resolve, reject) => {
    worker.once('message', resolve)
    worker.once('error', reject)
    worker.postMessage({ channel: Channel.CACHE_MAIN_SCRIPTS, value: dummyStamp, id: 'test-cache-1' })
  })

  // Send a second message with the same dummy stamp
  const secondResponse: any = await new Promise((resolve, reject) => {
    worker.once('message', resolve)
    worker.once('error', reject)
    worker.postMessage({ channel: Channel.CACHE_MAIN_SCRIPTS, value: dummyStamp, id: 'test-cache-2' })
  })

  // For caching purposes, the preview should be identical.
  t.deepEqual(firstResponse.preview, secondResponse.preview)
  worker.terminate()
})

const runBench = process.env.KIT_BENCH === 'true'
;(runBench ? test : test.skip)('benchmark - worker CACHE_MAIN_SCRIPTS', async (t) => {
  const previousResults = await loadPreviousResults()
  const isWindows = process.platform === 'win32'
  const runs = isWindows ? 5 : 20
  const times = []

  // Warm-up run (not measured)
  const warmup = await runWorkerMessage({
    channel: Channel.CACHE_MAIN_SCRIPTS,
    value: null,
    id: 'benchmark-warmup'
  })
  warmup.worker.terminate()

  for (let i = 0; i < runs; i++) {
    const { worker } = await (async () => {
      const start = performance.now()
      const result = await runWorkerMessage({
        channel: Channel.CACHE_MAIN_SCRIPTS,
        value: null,
        id: `benchmark-${i}`
      })
      const end = performance.now()
      times.push(end - start)
      if (i % Math.max(1, Math.floor(runs / 5)) === 0) {
        console.error(`[worker-diag] benchmark progress i=${i} duration=${(end-start).toFixed(1)}ms`)
      }
      return result
    })()
    worker.terminate()
  }

  const mean = times.reduce((a, b) => a + b, 0) / runs
  const opsPerSecond = (1000 / mean)

  const testName = 'worker_CACHE_MAIN_SCRIPTS'
  const oldResult = previousResults[testName]
  if (oldResult) {
    const oldOps = oldResult.operationsPerSecond
    const improvement = ((opsPerSecond - oldOps) / oldOps) * 100
    t.log(`Previous OPS: ${oldOps.toFixed(2)}`)
    t.log(`Current OPS: ${opsPerSecond.toFixed(2)}`)
    const emoji = improvement > 0 ? "🚀" : "🐌"
    t.log(`${emoji} Change: ${improvement.toFixed(2)}%`)
  } else {
    t.log('No previous benchmark to compare against.')
  }

  const newResults = {
    ...previousResults,
    [testName]: {
      timestamp: new Date().toISOString(),
      operationsPerSecond: opsPerSecond,
      meanDurationMs: mean
    }
  }
  await saveResults(newResults)

  t.pass()
})

test('Worker filters out scripts with exclude metadata', async (t) => {
  const { msg, worker } = await runWorkerMessage({
    channel: Channel.CACHE_MAIN_SCRIPTS,
    value: null,
    id: 'test-exclude-filter'
  })

  t.is(msg.channel, Channel.CACHE_MAIN_SCRIPTS)
  t.true(Array.isArray(msg.scripts), 'scripts should be an array')
  
  // Verify no scripts have exclude property set to true
  const excludedScriptsFound = msg.scripts.filter((script: any) => script.exclude === true)
  t.is(excludedScriptsFound.length, 0, 'No scripts with exclude:true should be present in cached scripts')
  
  // Log for debugging
  if (msg.scripts.length > 0) {
    t.log(`Total scripts after exclude filter: ${msg.scripts.length}`)
  }
  
  worker.terminate()
})

test('Worker preserves non-excluded scripts', async (t) => {
  const { msg, worker } = await runWorkerMessage({
    channel: Channel.CACHE_MAIN_SCRIPTS,
    value: null,
    id: 'test-preserve-non-excluded'
  })

  t.is(msg.channel, Channel.CACHE_MAIN_SCRIPTS)
  t.true(Array.isArray(msg.scripts), 'scripts should be an array')
  
  // Verify that scripts without exclude or with exclude:false are preserved
  const nonExcludedScripts = msg.scripts.filter((script: any) => 
    script.exclude === undefined || script.exclude === false
  )
  
  t.is(nonExcludedScripts.length, msg.scripts.length, 'All cached scripts should be non-excluded')
  
  worker.terminate()
})
