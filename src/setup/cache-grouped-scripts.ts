// Description: Clear Timestamps

import { getGroupedScripts } from "../api/kit.js"
import {
  getCachePath,
  mainScriptPath,
  formatChoices,
} from "../core/utils.js"

let cachePath = getCachePath(mainScriptPath, "choices")
let groupedScripts = await getGroupedScripts()
let scripts = formatChoices(groupedScripts)
await ensureDir(path.dirname(cachePath))
await writeJson(cachePath, scripts)

export {}
