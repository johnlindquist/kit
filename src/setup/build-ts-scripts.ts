import { buildTSScript } from "../api/kit.js"

let scripts = await getScripts()

// build all ts scripts
for await (let script of scripts) {
  if (script.filePath.endsWith(".ts")) {
    log(`Building ${script.filePath}`)
    try {
      await buildTSScript(script.filePath)
    } catch (error) {
      log(error)
    }
  }
}

export {}
