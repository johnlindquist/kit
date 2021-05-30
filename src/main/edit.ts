//Menu: Edit Menu
//Description: The right-click action of the app

import { CLI } from "../cli"

//Shortcut: cmd shift ;
let { scriptValue } = await import("../utils.js")

let command = await arg(
  {
    placeholder: `Which script do you want to edit?`,
  },
  scriptValue("command")
)

let editActions: Choice<keyof CLI>[] = [
  {
    name: "Open",
    description: `Open ${command}${
      env.KIT_EDITOR ? ` in ${env.KIT_EDITOR}` : ``
    }`,
    value: "edit",
  },
  {
    name: "Duplicate",
    description: `Make a copy of ${command} and open${
      env.KIT_EDITOR ? ` in ${env.KIT_EDITOR}` : ``
    }`,
    value: "duplicate",
  },
  {
    name: "Rename",
    description: `Prompt to rename ${command}`,
    value: "rename",
  },
  {
    name: "Remove",
    description: `Delete ${command} to trash`,
    value: "remove",
  },
  {
    name: `Open ${command}.log`,
    description: `Opens ${command}.log in your editor`,
    value: "open-command-log",
  },
]

let editAction = await arg("Which action?", editActions)
await cli(editAction, command)

export {}
