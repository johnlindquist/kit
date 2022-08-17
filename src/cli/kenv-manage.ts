// Description: Add/Remove/Update/Etc kenvs

import { Choice } from "../types/core"
import { CLI } from "../cli"

import {
  cliShortcuts,
  getKenvs,
  run,
} from "../core/utils.js"
import { addPreview } from "./lib/utils.js"

let kenvsExist = Boolean((await getKenvs()).length)

let insertIfKenvsExist = (elements: Choice<keyof CLI>[]) =>
  kenvsExist ? elements : []

let kenvManagementChoices: Choice<keyof CLI>[] = [
  {
    name: "Clone repo of scripts",
    description: `Clone a repo of scripts (AKA kenv)`,
    value: "kenv-clone",
  },
  {
    name: "New kenv",
    description: `Create a repo for scripts`,
    value: "kenv-create",
  },
  {
    name: "Link kenv",
    description: "Link local kenv from your hard drive",
    value: "kenv-add",
  },
  ...insertIfKenvsExist([
    {
      name: "View kenv",
      description: `View scripts from specified kenv`,
      value: "kenv-view",
    },
    {
      name: `Remove kenv`,
      description: `Remove a kenv`,
      value: "kenv-rm",
    },
    {
      name: `Push kenv`,
      description: `Runs git push on kenv repo`,
      value: "kenv-push",
    },
    {
      name: `Pull kenv`,
      description: `Runs git pull on kenv repo`,
      value: "kenv-pull",
    },
  ]),
]

let cliScript = await arg(
  {
    placeholder: "Kit Environment Actions",
    enter: "Select",
    shortcuts: cliShortcuts,
  },
  await addPreview(kenvManagementChoices, "kenv")
)

await run(kitPath("cli", cliScript) + ".js")

export {}
