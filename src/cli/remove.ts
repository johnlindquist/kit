// Description: Remove a script

import { refreshScriptsDb } from "../core/db.js"
import { selectScript, trashScript } from "../core/utils.js"

let script = await selectScript({
  placeholder: `Remove a script:`,
})

let { command, filePath } = script

let confirm =
  global?.flag?.confirm ||
  (await arg(
    {
      placeholder: `Remove ${command}?`,
      hint: filePath,
    },
    [
      { name: "No, cancel.", value: false },
      { name: `Yes, remove ${command}`, value: true },
    ]
  ))

if (confirm) {
  await trashScript(script)
  await refreshScriptsDb()
}

export {}
