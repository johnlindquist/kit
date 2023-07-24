import { Channel } from "../core/enum.js"

await sendWait(Channel.TOGGLE_WATCHER)

await wait(3000)

await mainScript()

export {}
