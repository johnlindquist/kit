// Description: Run the selected script
let { menu } = await cli("fns")

let script = await arg(
  {
    placeholder: `Which script do you want to run?`,
  },
  menu
)

await run(script)

export {}
