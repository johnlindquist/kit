//Menu: Edit Menu
//Description: The right-click action of the app
//Shortcut: cmd shift ;
let { menu, validate } = await cli("fns")

let script = await arg(
  {
    placeholder: `Which script do you want to edit?`,
    validate,
  },
  menu
)

script = script.endsWith(".js") ? script : `${script}.js`

let editActions: Choice<string>[] = [
  {
    name: "Open",
    description: `Open ${script}${
      env.KIT_EDITOR ? ` in ${env.KIT_EDITOR}` : ``
    }`,
    value: "edit",
  },
  {
    name: "Duplicate",
    description: `Make a copy of ${script} and open${
      env.KIT_EDITOR ? ` in ${env.KIT_EDITOR}` : ``
    }`,
    value: "duplicate",
  },
  {
    name: "Rename",
    description: `Prompt to rename ${script}`,
    value: "rename",
  },
  {
    name: "Remove",
    description: `Delete ${script} to trash`,
    value: "remove",
  },
]
let editAction = await arg("Which action?", editActions)
await cli(editAction, script)

export {}
