// Name: Manage Kit
// Description: Options and Helpers
// Exclude: true

import { createGuideConfig } from "./main-helper.js"

let cliScript = await docs(
  kitPath("KIT.md"),
  createGuideConfig({
    name: "Kit",
    input: arg?.input || "",
    placeholder: "Kit Actions",
  })
)
await run(kitPath(cliScript))
export {}
