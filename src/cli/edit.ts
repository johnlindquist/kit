// Description: Opens the selected script in your editor

import { selectScript } from "../core/utils.js"

let script = await selectScript(
  `Select script to open in ${await env("KIT_EDITOR")}?`
)

edit(await script.filePath, kenvPath())

export {}
