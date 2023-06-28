// Description: Remove a script

import { getTimestamps } from "../core/db.js"

let script = await selectScript(`Remove a script:`)
let stampDb = await getTimestamps()
stampDb.stamps = []
await stampDb.write()

await mainScript()

export {}
