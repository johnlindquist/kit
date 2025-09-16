import type { Script } from '../types/core'
import Bottleneck from 'bottleneck'
import { getGroupedScripts, processScriptPreview, scriptFlags } from '../api/kit.js'
import { Channel } from '../core/enum.js'
import { formatChoices } from '../core/utils.js'
import { parentPort } from 'node:worker_threads'
import { type Stamp, getScriptsDb, getTimestamps } from '../core/db.js'
import { scriptsSort } from '../core/utils.js'
import { clearParseScriptCache } from '../core/parser.js'

// --------------------
// Logging to Parent
// --------------------
const logToParent = (message: string) => {
  parentPort?.postMessage({
    channel: Channel.LOG_TO_PARENT,
    value: message
  })
}

// Early diagnostics to confirm worker startup in CI
logToParent(`[WORKER_INIT] pid=${process.pid}`)

// Emit a short heartbeat in Windows tests to prove liveness before messages
if (process.env.KIT_TEST && process.platform === 'win32') {
  let beats = 0
  const maxBeats = 3
  const timer = setInterval(() => {
    try {
      beats += 1
      logToParent(`[WORKER_HEARTBEAT] pid=${process.pid} beat=${beats}`)
      if (beats >= maxBeats) clearInterval(timer)
    } catch {}
  }, 1000)
}

// --------------------
// Pre-Sanitize Script Flags once
// --------------------
const sanitizedScriptFlags = (() => {
  const clone = JSON.parse(JSON.stringify(scriptFlags))
  for (const key of Object.keys(clone)) {
    if (clone[key]?.preview) {
      clone[key].preview = undefined
    }
  }
  return clone
})()

// --------------------
// Caching Variables
// --------------------
let cachedMessage: Awaited<ReturnType<typeof parseMainMenu>> | null = null

let cachedStampFilePath: string | null = null

// --------------------
// Update Timestamps DB
// --------------------
const updateTimestampsDb = async (stamp: Stamp) => {
  if (!stamp?.filePath) {
    logToParent('Invalid stamp received: missing filePath')
    return null
  }

  const originalFilePath = stamp.filePath
  const timestampsDb = await getTimestamps()
  const index = timestampsDb.stamps.findIndex((s) => s.filePath === originalFilePath)

  // Double-check we found the correct script
  if (index !== -1) {
    const foundStamp = timestampsDb.stamps[index]
    if (foundStamp.filePath !== originalFilePath) {
      logToParent(`Path mismatch - Original: ${originalFilePath}, Found: ${foundStamp.filePath}`)
      return null
    }
  }

  // Always set current timestamp
  const updatedStamp = { ...stamp, timestamp: Date.now(), filePath: originalFilePath }

  if (index === -1) {
    // New stamp
    if (updatedStamp.runCount) {
      updatedStamp.runCount = 1
    }
    logToParent(`Creating new stamp for: ${originalFilePath}`)
    timestampsDb.stamps.push(updatedStamp)
  } else {
    // Existing stamp
    const oldStamp = timestampsDb.stamps[index]
    if (updatedStamp.runCount) {
      updatedStamp.runCount = (oldStamp?.runCount || 0) + 1
    }
    // Ensure filePath consistency
    updatedStamp.filePath = originalFilePath
    timestampsDb.stamps[index] = { ...oldStamp, ...updatedStamp }
    logToParent(`Updated existing stamp for: ${originalFilePath} (runCount: ${updatedStamp.runCount})`)
  }

  try {
    // Final validation before write
    const finalStamp = index === -1 ? timestampsDb.stamps[timestampsDb.stamps.length - 1] : timestampsDb.stamps[index]
    if (finalStamp.filePath !== originalFilePath) {
      logToParent(
        `Critical error: Path mismatch before write - Expected: ${originalFilePath}, Got: ${finalStamp.filePath}`
      )
      return null
    }

    await timestampsDb.write()
  } catch (error) {
    logToParent(`Error writing timestampsDb: ${error}`)
  }

  return timestampsDb
}

// --------------------
// Parse Main Menu
// --------------------
const parseMainMenu = async (stamp: Stamp | null) => {
  // If we have a stamp, try to update timestamps and scriptsDb
  if (stamp) {
    const [timestampsDb, scriptsDb] = await Promise.all([updateTimestampsDb(stamp), getScriptsDb(false)])

    const script = scriptsDb.scripts.find((s) => s.filePath === stamp.filePath)
    if (script) {
      // Only resort and write if we actually found the script
      const oldOrder = scriptsDb.scripts.map(s => s.filePath).join(',')
      scriptsDb.scripts = scriptsDb.scripts.sort(scriptsSort(timestampsDb.stamps))
      const newOrder = scriptsDb.scripts.map(s => s.filePath).join(',')
      if (oldOrder !== newOrder) {
        try {
          await scriptsDb.write()
        } catch (error: any) {
          if (error.code !== 'ENOENT') {
            logToParent(`Error writing scriptsDb: ${error}`)
          }
        }
      }
    }
  }

  // Fetch grouped scripts and format
  const groupedScripts = await getGroupedScripts(false)
  logToParent(`Grouped scripts: ${groupedScripts.map((s) => s.name).join(', ')}`)
  const allScripts = formatChoices(groupedScripts)
  // Filter out excluded scripts to prevent flicker in main menu
  const scripts = allScripts.filter((s) => !s?.exclude)
  logToParent(
    `Formatted scripts (after exclude filter): ${scripts
      .slice(0, 10)
      .map((s) => s.name)
      .join(', ')} (${allScripts.length} total, ${scripts.length} after filter)`
  )

  const firstScript = scripts.find((script) => !script.skip) as Script | undefined
  let preview = ''
  const skipPreview = process.env.KIT_TEST === 'true'

  if (firstScript && !skipPreview) {
    try {
      preview = (await processScriptPreview(firstScript)()) as string
    } catch (error) {
      logToParent(`Error processing script preview: ${error}`)
    }
  } else if (skipPreview) {
    logToParent(`[parseMainMenu] Skipping preview generation in KIT_TEST env`)
  }

  // Sanitize scripts so no preview functions or values remain
  const sanitizedScripts = scripts.map((s) => {
    s.value = undefined
    if (typeof s.preview === 'function') {
      s.preview = undefined
    }
    return s
  })

  return {
    channel: Channel.CACHE_MAIN_SCRIPTS,
    scripts: sanitizedScripts,
    scriptFlags: sanitizedScriptFlags,
    preview
  }
}

// --------------------
// Cache Main Scripts Logic
// --------------------
const cacheMainScripts = async (id: string, stamp: Stamp | null) => {
  try {
    // Optimization: If we received the same stamp filePath consecutively
    // and have cached results, we can skip re-computation if stamp is null or unchanged.
    const stampFilePath = stamp?.filePath || null

    // If no stamp or the same stamp file, try to reuse cached results:
    // NOTE: WE MUST disable caching until a stamp can send a "sha" or something that represented the state of the script in the app cache since we don't have a way to know if the content of the script has changed.
    // if (!stampFilePath || stampFilePath === cachedStampFilePath) {
    //   if (cachedMessage) {
    //     // Reuse cached result
    //     logToParent(`[SCRIPTS RENDER] Worker ${id}: Reusing cached result for ${stampFilePath} with ${cachedMessage.scripts.length} scripts`)
    //     parentPort?.postMessage({ ...cachedMessage, id })
    //     return
    //   }
    // }

    // Otherwise, compute fresh results
    logToParent(`[SCRIPTS RENDER] Worker ${id}: Starting parseMainMenu for ${stampFilePath}`)
    const message = await parseMainMenu(stamp)

    // Cache results for next time
    cachedMessage = message
    cachedStampFilePath = stampFilePath

    logToParent(`[SCRIPTS RENDER] Worker ${id}: Sending fresh result for ${stampFilePath} with ${message.scripts.length} scripts`)
    parentPort?.postMessage({ ...message, id })
  } catch (error) {
    logToParent(`Error caching main scripts: ${error}`)
    parentPort?.postMessage({
      channel: Channel.CACHE_MAIN_SCRIPTS,
      error,
      scripts: [],
      scriptFlags: {},
      preview: '',
      id
    })
  }
}

// --------------------
// Concurrency Limiter
// --------------------
const limiter = new Bottleneck({ maxConcurrent: 1 })
const limitedCacheMainScripts = limiter.wrap(cacheMainScripts)

// --------------------
// Remove a Timestamp
// --------------------
const removeTimestamp = async (id: string, stamp: Stamp) => {
  logToParent(`Removing timestamp: ${stamp.filePath}`)
  const stampDb = await getTimestamps()
  const stampIndex = stampDb.stamps.findIndex((s) => s.filePath === stamp.filePath)

  if (stampIndex !== -1) {
    stampDb.stamps.splice(stampIndex, 1)
    await stampDb.write()
  }

  // It might be good to clear the parseScriptCache here too, as removing a script could affect DBs that trigger its invalidation.
  clearParseScriptCache(); // Explicitly clear the script cache

  // After removing timestamp, rebuild the menu
  await limitedCacheMainScripts(id, null)
}

// --------------------
// Clear All Timestamps
// --------------------
const clearTimestamps = async (id: string) => {
  logToParent(`${id}: Clearing timestamps`)
  clearParseScriptCache(); // Explicitly clear the script cache
  const stampDb = await getTimestamps()
  stampDb.stamps = []
  await stampDb.write()

  // After clearing, rebuild the menu
  await limitedCacheMainScripts(id, null)
}

// --------------------
// Message Handler
// --------------------
parentPort?.on(
  'message',
  ({
    channel,
    value,
    id,
    state
  }: {
    channel: Channel
    value?: any
    id?: string
    state?: {
      isSponsor: boolean
    }
  }) => {
    logToParent(`[RECV] channel=${channel} id=${id} filePath=${value?.filePath ?? ''}`)
    // This is received from the app from kitState.isSponsor
    process.env.KIT_SPONSOR = state?.isSponsor ? 'true' : 'false'
    if (channel === Channel.CACHE_MAIN_SCRIPTS) {
      limitedCacheMainScripts(id, value)
      return
    }

    if (channel === Channel.REMOVE_TIMESTAMP) {
      removeTimestamp(id, value)
      return
    }

    if (channel === Channel.CLEAR_TIMESTAMPS) {
      clearTimestamps(id)
      return
    }
  }
)
