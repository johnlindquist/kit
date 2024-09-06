let scriptPath = kitPath("cli", "sync-path-node.js")
let envPath = kenvPath(".env")

await term(`pnpm node ${scriptPath} ${envPath}`)

export {}
