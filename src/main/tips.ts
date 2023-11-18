// Name: Tips
// Description: Explore Script Kit Tips
// Keyword: tips
// Pass: true

import { createGuideConfig } from "./main-helper.js"

let selectedDoc = await docs(
  kitPath("TIPS.md"),
  createGuideConfig({
    name: "Tips",
    guidePath: kitPath("TIPS.md"),
    itemHeight: PROMPT.ITEM.HEIGHT.SM,
    input: arg?.input || arg?.input || "",
    placeholder: "Browse Tips",
    enter: `Open TIPS.md`,
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

let url =
  "https://github.com/johnlindquist/kit/blob/main/TIPS.md"

open(url)

export {}
