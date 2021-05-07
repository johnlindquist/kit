// Description: Opens the selected script in your editor

let { scriptValue, scriptPathFromCommand } = (await cli(
  "fns"
)) as typeof import("./fns")

let command = await arg(
  `Which script do you want to edit?`,
  scriptValue("command")
)

edit(scriptPathFromCommand(command), kenvPath())

export {}
