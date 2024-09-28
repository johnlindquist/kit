import { getLogFromScriptPath } from "../core/utils.js"

let { filePath } = await selectScript(
  `Open log for which script?`
)

let logPath = getLogFromScriptPath(filePath)
log(`Opening log for ${filePath}: ${logPath}`)
await ensureFile(logPath)

await edit(logPath)

export {}
