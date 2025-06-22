import "@johnlindquist/kit"
import { getLogFromScriptPath } from "../core/utils.js"

let scriptPath = await arg("Script Path")

let logPath = getLogFromScriptPath(scriptPath)
await terminal("tail", ["-f", logPath])
