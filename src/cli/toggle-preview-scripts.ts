import { getAppDb } from "../core/db.js"
import { mainScriptPath } from "../core/utils.js"

await selectScript()

let appDb = await getAppDb()
appDb.previewScripts = !appDb.previewScripts
await appDb.write()

await run(mainScriptPath)

export {}
