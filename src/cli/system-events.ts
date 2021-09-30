import { Script } from "../types/core"

import { getScripts } from "../core/db.js"

let scriptsCache: Script[] = await getScripts()

let filePath = await arg(
  "Which script do you want to edit?",
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

edit(filePath, kenvPath())

export {}
