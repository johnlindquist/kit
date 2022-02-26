import { buildWidget } from "../api/kit.js"

let scriptPath = await arg("Path to Widget:")
await buildWidget(scriptPath)

export {}
