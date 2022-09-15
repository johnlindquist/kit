// Name: Change Kit.app Shortcut

let shortcut = ""
let confirm = false

import { mainScriptPath } from "../core/utils.js"

while (!confirm) {
  ;({ shortcut } = await hotkey({
    placeholder: `Enter a key combo:`,
    panel: md(`## Change main shortcut`),
  }))
  confirm = await arg(`Accept: "${shortcut}"`, [
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

await div(md(`## ${shortcut} assigned to main`))

if (process.env.KIT_CONTEXT === "app") {
  await run(mainScriptPath)
}

export {}
