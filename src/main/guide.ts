// Name: Guide
// Description: Explore Script Kit Guide
// Keyword: guide
// Pass: true

import { createGuideConfig } from "./main-helper.js"

let selectedDoc = await docs(
  kitPath("GUIDE.md"),
  createGuideConfig({
    name: "Guide",
    guidePath: kitPath("GUIDE.md"),
    itemHeight: PROMPT.ITEM.HEIGHT.SM,
    input: arg?.input || arg?.input || "",
    placeholder: "Browse Guide",
    enter: `Open API.md`,
    preventCollapse: true,
    onNoChoices: async input => {
      setPanel(
        md(`# Expected ${input} in the Guide?
This guide is constantly evolving. If you're missing something, [suggest an edit](https://github.com/johnlindquist/kit/blob/main/GUIDE.md) to the guide or open an issue on GitHub.
`)
      )
    },
  })
)

// if selected docs is a url, then open it
if (selectedDoc.startsWith("http")) {
  open(selectedDoc)
} else {
  await run(kitPath("cli", selectedDoc))
  await mainScript("", "Guide")
}

export {}
