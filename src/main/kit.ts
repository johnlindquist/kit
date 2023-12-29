// Name: Kit Settings
// Description: Manage Kit Settings
// Keyword: kit
// Pass: true

import { createGuideConfig } from "./main-helper.js"

// TODO: Create a settings file for the kenv/kit paths

let cliScript = await docs(
  kitPath("KIT.md"),
  createGuideConfig({
    name: "Kit",
    guidePath: kitPath("KIT.md"),
    input: arg?.input || arg?.pass || "",
    placeholder: "Kit Actions",
    preventCollapse: true,
    onNoChoices: async input => {
      setPanel(
        md(`# Expected ${input} in the Kit Menu?
Feel free to [suggest an edit](https://github.com/johnlindquist/kit/blob/main/KIT.md) to the Kit menu or open an issue on GitHub.
`)
      )
    },
  })
)

if (cliScript.startsWith("http")) {
  open(cliScript)
} else {
  await run(kitPath(cliScript))
}

export {}
