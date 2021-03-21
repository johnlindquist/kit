// Description: Run the selected script
let { menu, validate } = await cli("fns")

let script = await arg(
  {
    message: `Which script do you want to run?`,
    validate,
  },
  menu
)

await run(script)
