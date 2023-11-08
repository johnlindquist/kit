// Description: Clear Timestamps

import {
  getGroupedScripts,
  processScriptPreview,
} from "../api/kit.js"
import { Channel } from "../core/enum.js"
import { formatChoices } from "../core/utils.js"

let groupedScripts = await getGroupedScripts()
let scripts = formatChoices(groupedScripts)
let firstScript = scripts.find(script => !script.skip)
let preview = ``
try {
  preview = await processScriptPreview(firstScript)()
} catch {}

process.send({
  channel: Channel.CACHE_SCRIPTS,
  scripts,
  preview,
})

export {}
