// Description: Clear Timestamps
import type { Script } from "../types/core"
import {
  getGroupedScripts,
  processScriptPreview,
  scriptFlags,
  shortcuts,
} from "../api/kit.js"
import { Channel } from "../core/enum.js"
import { formatChoices } from "../core/utils.js"
import { parentPort } from "worker_threads"
import { getScriptsDb, getTimestamps } from "../core/db.js"
import { Timestamp, scriptsSort } from "../core/utils.js"

parentPort?.on("message", async stamp => {
  console.log({
    worker: "cache-grouped-scripts-worker",
    stamp,
  })
  if (stamp) {
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
      if (global.log) global.log(error)
    }

    let scriptsDb = await getScriptsDb(false)
    let script = scriptsDb.scripts.find(
      s => s.filePath === stamp.filePath
    )

    if (script) {
      scriptsDb.scripts = scriptsDb.scripts.sort(
        scriptsSort(timestampsDb.stamps as Timestamp[])
      )
      try {
        await scriptsDb.write()
      } catch (error) {}
    }
  }

  let groupedScripts = await getGroupedScripts(false)
  let scripts = formatChoices(groupedScripts)
  let firstScript = scripts.find(
    script => !script.skip
  )
  let preview = ``
  try {
    preview = await processScriptPreview(firstScript as unknown as Script)()
  } catch (error) {
    console.error(error)
  }

  // Clone and remove all scriptFlags["key"].preview
  const sanitizedScriptFlags = Object.assign(
    {},
    scriptFlags
  ) as object
  for (const key in sanitizedScriptFlags) {
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

  const sanitizedShortcuts = shortcuts.map(s => {
    s.onPress = undefined
    s.condition = undefined
    return s
  })

  const message = {
    channel: Channel.CACHE_SCRIPTS,
    scripts: sanitizedScripts,
    scriptFlags: sanitizedScriptFlags,
    shortcuts: sanitizedShortcuts,
    preview,
  }

  parentPort.postMessage(message)
})
