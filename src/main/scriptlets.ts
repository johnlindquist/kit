// Name: Scriptlets
// Description: Docs for Script Kit Scriptlets
// Keyword: scriptlets
// Pass: true
// Enter: Open Scriptlets

import { createScriptletsConfig } from "./main-helper.js"

let scriptletsPath = kitPath("SCRIPTLETS.md")

await docs(
  scriptletsPath,
  createScriptletsConfig({
    name: "Scriptlets",
    guidePath: scriptletsPath,
    itemHeight: PROMPT.ITEM.HEIGHT.SM,
    input: arg?.input || "",
    placeholder: "Browse Scriptlets",
    enter: `Create Script`,
    preventCollapse: true,
    onNoChoices: async input => {
      setPanel(
        md(`# Expected ${input} in the Tips?
Tips are constantly evolving. If you're missing something, [suggest an edit](https://github.com/johnlindquist/kit-docs/blob/main/TIPS.md) to the tips.
`)
      )
    },
  })
)

export {}
