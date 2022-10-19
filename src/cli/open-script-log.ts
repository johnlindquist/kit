import { getLogFromScriptPath } from "../core/utils.js"

let { filePath, command } = await selectScript(
  `Open log for which script?`
)

let logPath = getLogFromScriptPath(filePath)

await ensureFile(logPath)

edit(logPath)

export {}
