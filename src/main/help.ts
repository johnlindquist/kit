import { Choice } from "../types/core"
import { CLI } from "../cli"
import { run } from "../core/utils.js"
import { addPreview } from "../cli/lib/utils.js"

let kitHelpChoices: Choice<keyof CLI>[] = [
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
    name: "Open Guide",
    description: `Work in progress...`,
    value: "goto-guide",
  },
  {
    name: "View Docs",
    description: `Work in progress...`,
    value: "view-docs",
  },
]

let cliScript = await arg(
  `Got questions?`,
  addPreview(kitHelpChoices, "help", "p-5")
)

await run(kitPath(`cli`, cliScript + ".js"))

export {}
