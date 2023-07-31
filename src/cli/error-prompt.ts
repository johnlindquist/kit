// Name: Error
// Description: An error has occurred

import { errorPrompt } from "../api/kit.js"

let error = await new Promise(resolve =>
  process.on("message", resolve)
)

await errorPrompt(error as Error)

export {}
