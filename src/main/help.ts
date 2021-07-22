import { Choice } from "kit-bridge/esm/type"
import { CLI } from "../cli"

let kitManagementChoices: Choice<keyof CLI>[] = [
  {
    name: "Get Help",
    description: `Post a question to Script Kit GitHub discussions`,
    value: "get-help",
  },
  {
    name: "Visit docs",
    description: `Work in progress...`,
    value: "goto-docs",
  },
  {
    name: "Subscribe to Newsletter",
    description: `Receive a newsletter with examples and tips`,
    value: "join",
  },
]

let cliScript = await arg(
  `Kit Options`,
  kitManagementChoices
)

await cli(cliScript)

export {}
