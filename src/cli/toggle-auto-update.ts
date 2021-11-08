import { getAppDb } from "../core/db.js"

let appDb = await getAppDb()
appDb.autoUpdate = !appDb.autoUpdate
await appDb.write()

export {}
