// Description: Run the selected script
import { run } from "../core/utils.js"

let { filePath } = await selectScript(
  `Which script do you want to run?`,
  true,
  scripts => scripts.filter(script => !script?.exclude)
)
await run(filePath)

export {}
