// Exclude: true

import { createGuideConfig } from "./main-helper.js"

let selectedDoc = await docs(
  kitPath("GUIDE.md"),
  createGuideConfig({
    name: "Guide",
    itemHeight: PROMPT.ITEM.HEIGHT.MD,
    input: arg?.input || "",
    placeholder: "Browse Guide",
    enter: `Suggest Edit`,
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
