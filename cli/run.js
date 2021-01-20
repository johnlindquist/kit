// Description: Run the selected script
// Shortcut: Alt+S

let { choices, validate } = await import("./scripts.js")

let command = await arg(
  `Which script do you want to run?`,
  {
    choices,
    validate,
  }
)

let fileName = command + ".js"
await run(path.join(env.SIMPLE_SCRIPTS_PATH, fileName))
