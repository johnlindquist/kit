let scriptPath = kitPath("cli", "sync-path-node.js")
let envPath = kenvPath(".env")
let node = isWin ? "node.exe" : "node"
let nodePath = knodePath("bin", node)

await term(`${nodePath} ${scriptPath} ${envPath}`)

export {}
