// Description: Run the selected script
// Shortcut: Alt+S

let { choices } = await import("./scripts.js")

let script = await arg(
  `Which script do you want to run?`,
  () => choices
)

await simple(script)
