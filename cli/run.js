// Description: Run the selected script
let { scripts } = await cli("fns")

let script = await arg(
  `Which script do you want to run?`,
  scripts,
  true
)

await run(script)
