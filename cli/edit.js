// Description: Opens the selected script in your editor

let { choices, validate } = await import("./scripts.js")

let file = await arg(
  {
    message: `Which script do you want to edit?`,
    validate,
  },
  choices
)

let fileName = file + ".js"
edit(projectPath(`scripts/${fileName}`))
