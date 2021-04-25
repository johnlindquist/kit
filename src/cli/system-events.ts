let { menu } = await cli("fns")

let scriptsCache: Script[] = await menu()

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
