// Description: Clear Timestamps

import { getTimestamps } from "../core/db.js"

let script = await selectScript(`Remove a script:`)

await global.clearTimestamps()

await mainScript()

export {}
