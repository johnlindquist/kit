// Description: Change Script Shortcut

import { Script } from "../types/core"
import {
  mainScriptPath,
  trashScript,
} from "../core/utils.js"

let { filePath, command, menu } = await selectScript(
  `Change shortcut of which script?`,
  true,
  scripts =>
    scripts
      .sort((a, b) => {
        if (a?.shortcut && !b?.shortcut) return -1
        if (b?.shortcut && !a?.shortcut) return 1
        if (!a?.shortcut && !b?.shortcut) return 0
        return a?.shortcut > b?.shortcut
          ? 1
          : a?.shortcut < b?.shortcut
          ? -1
          : 0
      })
      .map((script: Script) => {
        return {
          ...script,
          name: script?.menu || script.command,
          description: script?.description,
          value: script,
        }
      })
)

let { shortcut } = await hotkey()

let fileContents = await readFile(filePath, "utf-8")
let reg = /(?<=^\/\/\s*Shortcut:\s).*(?=$)/gim
if (
  fileContents.split("\n").some(line => line.match(reg))
) {
  let newContents = fileContents.replace(reg, shortcut)

  await writeFile(filePath, newContents)
} else {
  await writeFile(
    filePath,
    `// Shortcut: ${shortcut}\n${fileContents}`
  )
}
div(
  md(
    `${menu || command} assigned <code>${shortcut}</code>`
  ),
  `flex justify-center items-center`
)

await wait(2000, null)

if (process.env.KIT_CONTEXT === "app") {
  await run(mainScriptPath)
}

export {}
