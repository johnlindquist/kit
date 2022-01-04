import { buildTSScript } from "../api/kit.js"

let scriptPath = await arg("Path to TS Script:")
console.log({ scriptPath })
await buildTSScript(scriptPath)

export {}
