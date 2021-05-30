let { buildMainPromptChoices } = await import("../utils.js")

let scriptsCache: Script[] = await buildMainPromptChoices()

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
