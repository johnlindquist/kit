import { Channel } from "../core/enum.js"

send(Channel.CLEAR_PROMPT_CACHE)
setInput(``)

await mainScript()

export {}
