// Description: Opens the selected script in your editor

let { choices, validate } = await import("./scripts.js")

let file = await arg(
  `Which script do you want to edit?`,
  () => choices,
  validate
)

let fileName = file + ".js"
edit(path.join(env.SIMPLE_SCRIPTS_PATH, fileName))
