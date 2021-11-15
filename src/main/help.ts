import { Choice } from "../types/core"
import { kitDocsPath, run } from "../core/utils.js"
import { addPreview, findDoc } from "../cli/lib/utils.js"

setFlags({
  discuss: {
    name: "Discuss topic on Kit Dicussions",
    description: "Open discussion in browser",
  },
})

let kitHelpChoices: Choice[] = [
  {
    name: "Get Help",
    description: `Post a question to Script Kit GitHub discussions`,
    value: "get-help",
  },
  {
    name: "Subscribe to Newsletter",
    description: `Receive a newsletter with examples and tips`,
    value: "join",
  },
  {
    name: "Script Kit FAQ",
    description: `Frequently asked questions`,
    value: "faq",
  },
  {
    name: "Download Latest Docs",
    description: `Pull latest docs.json from scriptkit.com`,
    value: "download-docs",
    preview: async () => {
      return md(`
# Download Latest Docs

Hit <kbd>Enter</kbd> to grab the latest docs.json from scriptkit.com. Docs will automatically refresh when you re-open the \`Docs\` tab.
      `)
    },
  },
]

let selectedHelp = await arg(
  `Got questions?`,
  await addPreview(kitHelpChoices, "help")
)

let maybeCli = kitPath(`help`, selectedHelp + ".js")
if (flag?.discuss) {
  let doc = await findDoc("help", selectedHelp)
  console.log({ doc, selectedHelp })
  if (doc?.discussion) {
    await $`open ${doc?.discussion}`
  }
} else if (await pathExists(maybeCli)) {
  await run(maybeCli)
} else {
  let doc = await findDoc("help", selectedHelp)
  await $`open ${doc?.discussion}`
}

export {}
