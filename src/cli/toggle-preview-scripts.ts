import { getAppDb } from "../core/db.js"
import { getMainScriptPath } from "../core/utils.js"

await selectScript()

let appDb = await getAppDb()
appDb.previewScripts = !appDb.previewScripts
await appDb.write()

await run(getMainScriptPath())

export {}
