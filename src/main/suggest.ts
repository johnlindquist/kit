// Name: Google Suggest
// Description: Start typing to see Google Suggest results
// Pass: true

import "@johnlindquist/kit"
import { escapeShortcut } from "../core/utils.js"

let { default: suggest } = await import("suggestion")

let input = await arg(
  {
    name: "Google Suggest",
    input: (arg?.pass as string) || "",
    placeholder: "Google suggest:",
    enter: `Paste`,
    // shortcuts: [escapeShortcut],
    resize: true,
  },
  async input => {
    if (input?.length < 3)
      return [
        {
          name: `Type at least 4 characters`,
          skip: true,
          info: true,
        },
      ]

    return await new Promise((res, rej) => {
      suggest(input, (err, suggestions) => {
        if (err) {
          res(`## Error: ${err}`)
        } else {
          res(suggestions)
        }
      })
    })
  }
)

// await run(kitPath("main", "google.js"), `--input`, input)
setSelectedText(input)
export {}
