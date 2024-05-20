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

let groupedScripts = await getGroupedScripts()
let scripts = formatChoices(groupedScripts)
let firstScript = scripts.find(
  script => !script.skip
)
let preview = ``
try {
  preview = await processScriptPreview(firstScript as unknown as Script)()
} catch {}

process.send({
  channel: Channel.CACHE_SCRIPTS,
  scripts,
  preview,
  scriptFlags,
  shortcuts,
})

export {}
