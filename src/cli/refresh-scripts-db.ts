import { refreshScriptsDb } from "../core/db.js"

await refreshScriptsDb()

await run(kitPath("cli", "app-run.js"))

export { }
