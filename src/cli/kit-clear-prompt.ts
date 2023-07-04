import { getScripts, getTimestamps } from "../core/db.js"
import { Channel } from "../core/enum.js"

await sendWait(Channel.CLEAR_PROMPT_CACHE)
setInput(``)
await getTimestamps(false)
await getScripts(false)

await mainScript()

export {}
