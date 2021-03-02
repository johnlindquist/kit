// Description: The "main" script
// Shortcut: cmd ;

//Note: Feel free to edit this file!

let script = await arg(
  `Which script do you want to run?`,
  //Put "choices" inside of function when caching to avoid re-running
  async () => (await cli("scripts")).scripts,
  //Enable caching
  true
)

await run(script)
