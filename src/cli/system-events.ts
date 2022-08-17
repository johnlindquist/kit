import { Script } from "../types/core"

import { getScripts } from "../core/db.js"
import { cliShortcuts } from "../core/utils.js"

let scriptsCache: Script[] = await getScripts()

let filePath = await arg(
  {
    placeholder: "Which script do you want to edit?",
    enter: "Select",
    shortcuts: cliShortcuts,
  },
  scriptsCache
    .filter(script => script?.system)
    .map(script => {
      return {
        name: script?.menu || script.command,
        description: `Runs on ${script.system}`,
        value: script.filePath,
      }
    })
)

await run(kitPath("cli", "edit-script.js"), filePath)

export {}
