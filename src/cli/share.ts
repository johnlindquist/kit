//Menu: Share Script
//Description: Share the selected script

import { Script } from "kit-bridge/esm/type"
import { getScripts } from "kit-bridge/esm/db"
import { CLI } from "../cli"

let { command }: Script = await arg(
  `Which script do you want to share?`,
  await getScripts()
)

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

await cli(how, command)

export {}
