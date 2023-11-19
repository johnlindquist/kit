// Name: Tips
// Description: Explore Script Kit Tips
// Keyword: tips
// Pass: true

import { createTipsConfig } from "./main-helper.js"

await docs(
  kitPath("TIPS.md"),
  createTipsConfig({
    name: "Tips",
    guidePath: kitPath("TIPS.md"),
    itemHeight: PROMPT.ITEM.HEIGHT.SM,
    input: arg?.input || arg?.input || "",
    placeholder: "Browse Tips",
    enter: `Create Script`,
    preventCollapse: true,
    onNoChoices: async input => {
      setPanel(
        md(`# Expected ${input} in the Tips?
Tips are constantly evolving. If you're missing something, [suggest an edit](https://github.com/johnlindquist/kit/blob/main/TIPS.md) to the tips.
`)
      )
    },
  })
)

export {}
