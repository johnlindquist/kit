// Description: Rename Script

import { refreshScripts } from "../core/db.js"
import {
  checkIfCommandExists,
  extensionRegex,
  trashScriptBin,
} from "../core/utils.js"

import { default as generate } from "project-name-generator"

let examples = Array.from({ length: 3 })
  .map((_, i) => generate({ words: 2 }).dashed)
  .join(", ")

import { Script } from "../types/core.js"

let script: Script = await selectScript(
  `Which script do you want to rename?`
)

let { filePath } = script

let scriptExtension = path.extname(filePath)

let newCommand = await arg(
  {
    description: `Rename ${filePath}`,
    placeholder: `Enter the new script name:`,
    validate: checkIfCommandExists,
    strict: false,
  },
  [
    {
      info: true,
      name: `Requirements: lowercase, dashed, no extension`,
      description: `Examples: ${examples}`,
    },
  ]
)

let lenientCommand = newCommand.replace(extensionRegex, "")

let newFilePath = path.resolve(
  path.dirname(filePath),
  lenientCommand + scriptExtension
)

try {
  await trashScriptBin(script)
} catch (error) {
  warn(error)
}

mv(filePath, newFilePath)
await cli("create-bin", "scripts", newFilePath)
await refreshScripts()

await edit(newFilePath, kenvPath())

export {}
