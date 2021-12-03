// Name: Change Kit.app Shortcut

let shortcut = ""
let confirm = false

import { mainScriptPath } from "../core/utils.js"

while (!confirm) {
  ;({ shortcut } = await hotkey("Type a key combo"))
  confirm = await arg(`Accept: "${shortcut}"`, [
    {
      name: `Yes`,
      value: true,
    },
    {
      name: `Retry`,
      value: false,
    },
  ])
}

let kitDb = await db(kitPath("db", "shortcuts.json"))
kitDb.data.shortcuts[kitPath("main", "index.js")] = shortcut
await kitDb.write()

setPanel(`<div class="px-6 py-4">
${shortcut} assigned to main
 </div>`)

await wait(2000, null)

if (process.env.KIT_CONTEXT === "app") {
  await run(mainScriptPath)
}

export {}
