import { Choice } from "@core/type"
import { CLI } from "cli"

let otherOptions: Choice<keyof CLI>[] = [
  {
    name: "Switch Kenv",
    description: "Switch to a different Kit environment",
    value: "kenv-switch",
  },
  {
    name: `Open Kenv in Editor`,
    description: `Open ${kitPath()}`,
    value: "open-kenv",
  },
  {
    name: "Create Kenv",
    description: "Create a new Kit environment",
    value: "kenv-create",
  },
  {
    name: "Add Kenv",
    description: "Add an existing kenv",
    value: "kenv-add",
  },
  {
    name: "Generate bin files",
    description: "Recreate all the terminal executables",
    value: "create-all-bins",
  },
  {
    name: "Change script shortcut",
    description:
      "Pick a new keyboard shortcut for a script",
    value: "change-shortcut",
  },
]

let cliScript = await arg<keyof CLI>(
  `Manage Kit environment`,
  otherOptions
)

await cli(cliScript)

export {}
