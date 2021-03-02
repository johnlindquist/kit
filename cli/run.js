// Description: Run the selected script

let script = await arg(
  `Which script do you want to run?`,
  async () => (await cli("scripts")).scripts,
  true
)

await run(script)
