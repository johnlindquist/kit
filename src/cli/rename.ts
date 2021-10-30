// Description: Rename Script

import { refreshScriptsDb } from "../core/db.js"
import {
  exists,
  extensionRegex,
  selectScript,
  trashScript,
} from "../core/utils.js"

import { Script } from "../types/core.js"

let script: Script = await selectScript(
  `Which script do you want to rename?`
)

let { filePath } = script

let scriptExtension = path.extname(filePath)

let newCommand = await arg({
  placeholder: `Enter the new script name:`,
  selected: filePath,
  validate: exists,
})

let lenientCommand = newCommand.replace(extensionRegex, "")

let newFilePath = path.resolve(
  path.dirname(filePath),
  lenientCommand + scriptExtension
)

mv(filePath, newFilePath)
await trashScript(script)
await refreshScriptsDb()

await cli("create-bin", "scripts", newFilePath)
edit(newFilePath, kenvPath())

export {}
