// Description: Run the selected script
import { run, selectScript } from "../core/utils.js"

let { command } = await selectScript(
  `Which script do you want to run?`,
  true,
  scripts => scripts.filter(script => !script?.exclude)
)
await run(command)

export {}
