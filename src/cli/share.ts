//Menu: Share Script
//Description: Share the selected script

import { CLI } from "../cli"
import { selectScript } from "../core/utils.js"

let { filePath } = await selectScript(`Share which script?`)

let how: keyof CLI = await arg(
  "How would you like to share?",
  [
    {
      name: "Copy script to clipboard",
      value: "share-copy",
    },
    {
      name: "Post as a gist",
      value: "share-script",
    },
    {
      name: "Create install link",
      value: "share-script-as-link",
    },
    {
      name: "Prep for discussion",
      value: "share-script-as-discussion",
    },
  ]
)

await cli(how, filePath)

export {}
