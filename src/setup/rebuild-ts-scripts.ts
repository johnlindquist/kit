import { buildTSScript } from "../api/kit.js"

process.once(
  "message",
  async ({ scriptPaths }: { scriptPaths: string[] }) => {
    for await (let scriptPath of scriptPaths) {
      if (scriptPath.endsWith(".ts")) {
        await buildTSScript(scriptPath)
      }
    }
  }
)
// build all ts scripts

export {}
