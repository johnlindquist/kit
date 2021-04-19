// Description: Run the selected script
let { findScript, menu } = await cli("fns")

let script = await arg(
  {
    placeholder: `Which script do you want to run?`,
    validate: findScript,
  },
  menu
)

await run(script)

export {}
