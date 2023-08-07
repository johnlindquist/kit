// Name: Manage Kenvs
// Enter: Add/Remove/Manage kenvs
// Keyword: kenv

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
  {
    name: `Open Kenv Directory in a Terminal`,
    description: `Open the directory of the kenv in a terminal`,
    value: "kenv-term",
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
      name: `Visit kenv repo`,
      description: `Open the repo of the kenv in your browser`,
      value: "kenv-visit",
    },
    {
      name: `Trust kenv`,
      description: `Trust the scripts in a kenv to run automatically`,
      value: "kenv-trust",
    },
    {
      name: `Distrust kenv`,
      description: `Don't allow the scripts in a kenv to run automatically`,
      value: "kenv-distrust",
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
