import { Bin } from "../core/enum.js"
import { getScripts } from "../core/db.js"
import { createBinFromScript } from "./lib/utils.js"

await trash([
  `!${kenvPath("bin", ".gitignore")}`,
  kenvPath("bin", "*"),
])

let scripts = await getScripts(false)

for (let script of scripts) {
  await createBinFromScript(Bin.scripts, script)
}

export {}
