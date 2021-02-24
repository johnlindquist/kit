// Description: Run the selected script

let script = await arg(
  `Which script do you want to run?`,
  async () => (await import("./scripts.js")).choices
)

await run(script)
