// Description: Clear Timestamps
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

const logToParent = (message: string) => {
  parentPort?.postMessage({
    channel: Channel.LOG_TO_PARENT,
    value: message,
  })
}

const getTimestampsDb = async (stamp: Stamp) => {
  let timestampsDb = await getTimestamps()
  let index = timestampsDb.stamps.findIndex(
    s => s.filePath === stamp.filePath
  )

  let oldStamp = timestampsDb.stamps[index]

  stamp.timestamp = Date.now()
  if (stamp.runCount) {
    stamp.runCount = oldStamp?.runCount
      ? oldStamp.runCount + 1
      : 1
  }
  if (oldStamp) {
    timestampsDb.stamps[index] = {
      ...oldStamp,
      ...stamp,
    }
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

const parseMainMenu = async (stamp: Stamp = null) => {
  logToParent(
    `${stamp?.filePath || "No stamp"}: Parsing main menu`
  )
  if (stamp) {
    let [timestampsDb, scriptsDb] = await Promise.all([
      getTimestampsDb(stamp),
      getScriptsDb(false),
    ])

    let script = scriptsDb.scripts.find(
      s => s.filePath === stamp.filePath
    )

    if (script) {
      scriptsDb.scripts = scriptsDb.scripts.sort(
        scriptsSort(timestampsDb.stamps)
      )
      try {
        await scriptsDb.write()
      } catch (error) {
        logToParent(`Error writing scriptsDb: ${error}`)
      }
    }
  }

  let groupedScripts = await getGroupedScripts(false)
  let scripts = formatChoices(groupedScripts)
  let firstScript = scripts.find(script => !script.skip)
  let preview = ""
  try {
    preview = await processScriptPreview(
      firstScript as unknown as Script
    )()
  } catch (error) {
    logToParent(`Error processing script preview: ${error}`)
  }

  // Clone and remove all scriptFlags["key"].preview
  const sanitizedScriptFlags = Object.assign(
    {},
    scriptFlags
  ) as object
  for (const key of Object.keys(sanitizedScriptFlags)) {
    if (sanitizedScriptFlags?.[key]?.preview) {
      sanitizedScriptFlags[key].preview = undefined
    }
  }

  const sanitizedScripts = scripts.map(s => {
    s.value = undefined
    s.preview =
      typeof s.preview === "function"
        ? undefined
        : s.preview
    return s
  })

  const message = {
    channel: Channel.CACHE_MAIN_SCRIPTS,
    scripts: sanitizedScripts,
    scriptFlags: sanitizedScriptFlags,
    preview,
  }

  return message
}

const cacheMainScripts = async (
  id: string,
  stamp: Stamp
) => {
  try {
    logToParent(`${id}: Caching main scripts`)
    const message = await parseMainMenu(stamp)
    parentPort.postMessage({ ...message, id })
  } catch (error) {
    logToParent(`Error caching main scripts: ${error}`)
    parentPort.postMessage({
      channel: Channel.CACHE_MAIN_SCRIPTS,
      error,
      scripts: [],
      scriptFlags: {},
      preview: "",
      id,
    })
  }
}

const limiter = new Bottleneck({ maxConcurrent: 1 })
const limitedCacheMainScripts = limiter.wrap(
  cacheMainScripts
)

const removeTimestamp = async (
  id: string,
  stamp: Stamp
) => {
  logToParent(`Removing timestamp: ${stamp.filePath}`)
  const stampDb = await getTimestamps()
  const stampIndex = stampDb.stamps.findIndex(
    s => s.filePath === stamp.filePath
  )

  if (stampIndex !== -1) {
    stampDb.stamps.splice(stampIndex, 1)
    await stampDb.write()
  }

  await limitedCacheMainScripts(id, null)
}

const clearTimestamps = async (id: string) => {
  logToParent(`${id}: Clearing timestamps`)
  const stampDb = await getTimestamps()
  stampDb.stamps = []
  await stampDb.write()

  await limitedCacheMainScripts(id, null)
}

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
