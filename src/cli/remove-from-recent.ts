// Description: Remove a script timestamp

import { Channel } from "../core/enum.js"

let script = await selectScript(`Remove a script:`)

let { filePath } = script
await global.removeTimestamp(filePath)

await mainScript()

export {}
