// Description: Remove a script

import { getTimestamps } from "../core/db.js"

let script = await selectScript(`Remove a script:`)

let { filePath } = script

let stampDb = await getTimestamps()
let stamp = stampDb.stamps.findIndex(
  s => s.filePath === filePath
)

stampDb.stamps.splice(stamp, 1)
await stampDb.write()

await mainScript()

export {}
