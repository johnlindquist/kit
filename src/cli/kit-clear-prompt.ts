import { getScriptsDb, getTimestamps } from "../core/db.js"
import { Channel } from "../core/enum.js"

await sendWait(Channel.CLEAR_PROMPT_CACHE)
setInput(``)
await getTimestamps(false)
await getScriptsDb(false)

await mainScript()

export {}
