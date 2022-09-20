// Name: Manage Kit
// Description: Options and Helpers

import { createGuideConfig } from "./main-helper.js"

let cliScript = await docs(
  kitPath("KIT.md"),
  createGuideConfig({})
)
await run(kitPath("cli", cliScript))
export {}
