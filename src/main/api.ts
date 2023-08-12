// Name: Browse Kit API
// Keyword: api

import { createGuideConfig } from "./main-helper.js"

let selectedDoc = await docs(
  kitPath("API.md"),
  createGuideConfig({
    name: "API",
    itemHeight: PROMPT.ITEM.HEIGHT.SM,
    input: arg?.input || "",
    placeholder: "Browse API",
    enter: `Suggest Edit`,
    preventCollapse: true,
    onNoChoices: async input => {
      setPanel(
        md(`# Expected ${input} in the Docs?
This api docs are constantly evolving. If you're missing something, [suggest an edit](https://github.com/johnlindquist/kit/blob/main/API.md) to the api docs or open an issue on GitHub.
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
  await mainScript("", "API")
}

export {}
