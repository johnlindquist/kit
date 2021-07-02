import { CLI } from "../cli"
import { getKenvs } from "../utils.js"

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
]

let cliScript = await arg(
  `Kit Options`,
  kitManagementChoices
)

await cli(cliScript)

export {}
