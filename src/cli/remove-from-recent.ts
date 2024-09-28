// Description: Remove a script timestamp

import { refreshScripts } from "../core/db.js"

let script = await selectScript(`Remove a script:`)

let { filePath } = script
await global.removeTimestamp(filePath)
await refreshScripts()

await mainScript()

export {}
