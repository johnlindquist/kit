// Description: Clear Timestamps

import { refreshScripts } from "../core/db.js"

let script = await selectScript(`Remove a script:`)

await global.clearTimestamps()
await refreshScripts()

await mainScript()

export {}
