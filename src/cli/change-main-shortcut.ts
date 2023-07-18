// Name: Change Shortcut

let shortcut = ""
let confirm = false

import { mainScriptPath } from "../core/utils.js"

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

let kitDb = await db(kitPath("db", "shortcuts.json"))

kitDb.data.shortcuts[kitPath("main", "index.js")] = shortcut
await kitDb.write()

arg(`Shortcut Changed`, [
  {
    name: `Shortcut changed to ${shortcut}`,
    info: true,
  },
])

await wait(1500)
submit("")

if (process.env.KIT_CONTEXT === "app") {
  await run(mainScriptPath)
}

export {}
