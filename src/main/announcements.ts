// Name: Announcements
// Description: Script Kit Announcements
// Keyword: announcements
// Pass: true
// Enter: Open Announcements

import { createGuideConfig } from "./main-helper.js"

let selectedDoc = await docs(
  kitPath("ANNOUNCEMENTS.md"),
  createGuideConfig({
    name: "Announcements",
    guidePath: kitPath("ANNOUNCEMENTS.md"),
    itemHeight: PROMPT.ITEM.HEIGHT.SM,
    input: arg?.input || arg?.input || "",
    placeholder: "Browse Announcements",
    enter: `Open ANNOUNCEMENTS.md`,
    preventCollapse: true,
    onNoChoices: async input => {
      setPanel(
        md(`# Expected ${input} in the Announcements?
This guide is constantly evolving. If you're missing something, [suggest an edit](https://github.com/johnlindquist/kit-docs/blob/main/ANNOUNCEMENTS.md) to the guide or open an issue on GitHub.
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
  await mainScript("", "Announcements")
}

export {}
