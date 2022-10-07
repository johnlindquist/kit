// Name: Manage Kit
// Description: Options and Helpers

import { createGuideConfig } from "./main-helper.js"

let cliScript = await docs(
  kitPath("KIT.md"),
  createGuideConfig({
    name: "Kit",
    input: arg?.input || "",
    placeholder: "Kit Actions",
  })
)
await run(kitPath("cli", cliScript))
export {}
