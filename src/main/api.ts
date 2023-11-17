// Name: API
// Description: Browse Kit API
// Keyword: api
// Pass: true

import { createGuideConfig } from "./main-helper.js"

let selectedDoc = await docs(
  kitPath("API.md"),
  createGuideConfig({
    name: "API",
    guidePath: kitPath("API.md"),
    itemHeight: PROMPT.ITEM.HEIGHT.SM,
    input: arg?.input || arg?.pass || "",
    placeholder: "Browse API",
    enter: `Open API.md`,
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

let url =
  "https://github.com/johnlindquist/kit/blob/main/API.md"

open(url)

export {}
