import { Bin } from "../enums.js"
import {
  buildMainPromptChoices,
  createBinFromScript,
} from "../utils.js"

await trash([
  `!${kenvPath("bin", ".gitignore")}`,
  kenvPath("bin", "*"),
])

let scripts = await buildMainPromptChoices()

for await (let script of scripts) {
  await createBinFromScript(Bin.scripts, script)
}

export {}
