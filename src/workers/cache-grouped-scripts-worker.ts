import type { Script } from "../types/core"
import Bottleneck from "bottleneck"
import {
  getGroupedScripts,
  processScriptPreview,
  scriptFlags,
} from "../api/kit.js"
import { Channel } from "../core/enum.js"
import { formatChoices } from "../core/utils.js"
import { parentPort } from "node:worker_threads"
import {
  type Stamp,
  getScriptsDb,
  getTimestamps,
} from "../core/db.js"
import { scriptsSort } from "../core/utils.js"

// --------------------
// Logging to Parent
// --------------------
const logToParent = (message: string) => {
  parentPort?.postMessage({
    channel: Channel.LOG_TO_PARENT,
    value: message,
  })
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
let cachedMessage: ReturnType<typeof parseMainMenu> | null = null

let cachedStampFilePath: string | null = null

// --------------------
// Update Timestamps DB
// --------------------
const updateTimestampsDb = async (stamp: Stamp) => {
  const timestampsDb = await getTimestamps()
  const index = timestampsDb.stamps.findIndex(s => s.filePath === stamp.filePath)
  const oldStamp = timestampsDb.stamps[index]

  stamp.timestamp = Date.now()
  if (stamp.runCount) {
    stamp.runCount = oldStamp?.runCount ? oldStamp.runCount + 1 : 1
  }

  if (oldStamp) {
    timestampsDb.stamps[index] = { ...oldStamp, ...stamp }
  } else {
    timestampsDb.stamps.push(stamp)
  }

  try {
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
    const [timestampsDb, scriptsDb] = await Promise.all([
      updateTimestampsDb(stamp),
      getScriptsDb(false),
    ])

    const script = scriptsDb.scripts.find(s => s.filePath === stamp.filePath)
    if (script) {
      // Only resort and write if we actually found the script
      scriptsDb.scripts = scriptsDb.scripts.sort(scriptsSort(timestampsDb.stamps))
      try {
        await scriptsDb.write()
      } catch (error) {
        logToParent(`Error writing scriptsDb: ${error}`)
      }
    }
  }

  // Fetch grouped scripts and format
  const groupedScripts = await getGroupedScripts(false)
  const scripts = formatChoices(groupedScripts)

  const firstScript = scripts.find(script => !script.skip) as Script | undefined
  let preview = ""
  if (firstScript) {
    try {
      preview = await processScriptPreview(firstScript)()
    } catch (error) {
      logToParent(`Error processing script preview: ${error}`)
    }
  }

  // Sanitize scripts so no preview functions or values remain
  const sanitizedScripts = scripts.map(s => {
    s.value = undefined
    if (typeof s.preview === "function") {
      s.preview = undefined
    }
    return s
  })

  return {
    channel: Channel.CACHE_MAIN_SCRIPTS,
    scripts: sanitizedScripts,
    scriptFlags: sanitizedScriptFlags,
    preview,
  }
}

// --------------------
// Cache Main Scripts Logic
// --------------------
const cacheMainScripts = async (
  id: string,
  stamp: Stamp | null
) => {
  try {
    // Optimization: If we received the same stamp filePath consecutively
    // and have cached results, we can skip re-computation if stamp is null or unchanged.
    const stampFilePath = stamp?.filePath || null

    // If no stamp or the same stamp file, try to reuse cached results:
    if (!stampFilePath || stampFilePath === cachedStampFilePath) {
      if (cachedMessage) {
        // Reuse cached result
        parentPort?.postMessage({ ...cachedMessage, id })
        return
      }
    }

    // Otherwise, compute fresh results
    logToParent(`${id}: Parsing main menu`)
    const message = await parseMainMenu(stamp)

    // Cache results for next time
    cachedMessage
    cachedStampFilePath = stampFilePath

    parentPort?.postMessage({ ...message, id })
  } catch (error) {
    logToParent(`Error caching main scripts: ${error}`)
    parentPort?.postMessage({
      channel: Channel.CACHE_MAIN_SCRIPTS,
      error,
      scripts: [],
      scriptFlags: {},
      preview: "",
      id,
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
  const stampIndex = stampDb.stamps.findIndex(s => s.filePath === stamp.filePath)

  if (stampIndex !== -1) {
    stampDb.stamps.splice(stampIndex, 1)
    await stampDb.write()
  }

  // After removing timestamp, rebuild the menu
  await limitedCacheMainScripts(id, null)
}

// --------------------
// Clear All Timestamps
// --------------------
const clearTimestamps = async (id: string) => {
  logToParent(`${id}: Clearing timestamps`)
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
  "message",
  ({
    channel,
    value,
    id,
  }: {
    channel: Channel
    value?: any
    id?: string
  }) => {
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
