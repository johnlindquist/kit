// Description: Run the selected script
import { run } from "../core/utils.js"

let { filePath } = await selectScript(
  `Which script do you want to run?`,
  true
)
await run(filePath)

export {}
