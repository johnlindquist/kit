// Name: Change Shortcut

let shortcut = ""
let confirm = false

import { getMainScriptPath } from "../core/utils.js"

while (!confirm) {
  ;({ shortcut } = await hotkey({
    description: `Change shortcut for main menu`,
    placeholder: `Enter a key combo:`,
  }))
  confirm = await arg(`Accept`, [
    {
      name: `Accept: "${shortcut}"`,
      info: true,
    },
    {
      name: `[Y]es`,
      value: true,
    },
    {
      name: `[R]etry`,
      value: false,
    },
  ])
}
await run(
  kitPath("cli", "set-env-var.js"),
  "KIT_MAIN_SHORTCUT",
  shortcut
)

arg(`Shortcut Changed`, [
  {
    name: `Shortcut changed to ${shortcut}`,
    info: true,
  },
])

await wait(1500)
submit("")

if (process.env.KIT_CONTEXT === "app") {
  await run(getMainScriptPath())
}

export {}
