// Description: The "main" script
// Shortcut: cmd ;

let { choices } = await sdk("cli/scripts")

let script = await arg(
  `Which script do you want to run?`,
  choices
)

await run(script)
