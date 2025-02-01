// File: src/workers/cache-grouped-scripts-worker.test.ts
import test from 'ava'
import { Worker } from 'node:worker_threads'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import fs from 'node:fs'
import { execSync } from 'node:child_process'
import { Channel } from '../core/enum.js'

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

    // Listen for messages and resolve when we get a CACHE_MAIN_SCRIPTS message
    worker.on('message', (msg) => {
      if (msg.channel === Channel.CACHE_MAIN_SCRIPTS && !resolved) {
        resolved = true
        resolve({ msg, worker })
      }

      if (msg.channel === Channel.LOG_TO_PARENT) {
        console.log(msg.value)
      }
    })
    worker.once('error', (err) => reject(err))
    worker.postMessage(messageToSend)

    // Add timeout to prevent hanging
    setTimeout(() => {
      if (!resolved) {
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
  t.log(
    msg.scripts
      .map((s) => s.name)
      .slice(0, 10)
      .join('\n')
  )
  t.log(msg.preview)
  if (msg.scripts.length > 0) {
    const firstItem = msg.scripts[0]
    t.true(typeof firstItem.id === 'string', 'Each script item should have an id')
    t.true(typeof firstItem.name === 'string', 'Each script item should have a name')
  }
  t.truthy(msg.scriptFlags, 'scriptFlags should be defined')
  t.true(typeof msg.preview === 'string', 'preview should be a string')
  worker.terminate()
})
