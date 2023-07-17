// Description: Clear Timestamps

import { getGroupedScripts } from "../api/kit.js"
import { Channel } from "../core/enum.js"
import { formatChoices } from "../core/utils.js"

let groupedScripts = await getGroupedScripts()
let scripts = formatChoices(groupedScripts).map(choice => {
  choice.description = ""
  return choice
})

process.send({
  channel: Channel.CACHE_SCRIPTS,
  value: scripts,
})

export {}
