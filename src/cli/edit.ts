// Description: Opens the selected script in your editor

let { scriptValue } = (await cli(
  "fns"
)) as typeof import("./fns")

let filePath = await arg(
  `Which script do you want to edit?`,
  scriptValue("filePath")
)

edit(filePath, kenvPath())

export {}
