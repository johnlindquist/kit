import { buildTSScript } from "../api/kit.js"

let scriptPath = await arg("Path to TS Script:")
await buildTSScript(scriptPath)

export {}
