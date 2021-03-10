// Description: Opens the selected script in your editor

let { scripts, validate } = await cli("scripts")

let file = await arg(
  {
    message: `Which script do you want to edit?`,
    validate,
  },
  scripts
)

let fileName = file + ".js"
edit(kenvPath(`scripts/${fileName}`), kenvPath())
