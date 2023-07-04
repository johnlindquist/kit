// Description: Remove a script

import { refreshScripts } from "../core/db.js"
import { trashScript } from "../core/utils.js"

let script = await selectScript(`Remove a script:`)

let { command, filePath } = script

let confirm =
  global?.flag?.confirm ||
  (await arg(`Remove ${command}?`, [
    { info: true, name: filePath },
    { name: "[N]o, cancel.", value: false },
    { name: `[Y]es, remove ${command}`, value: true },
  ]))

if (confirm) {
  await trashScript(script)
  await refreshScripts()
}

if (process.env.KIT_CONTEXT === "app") {
  await mainScript()
}
export {}
