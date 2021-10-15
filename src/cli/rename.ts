// Description: Rename Script

import {
  exists,
  selectScript,
  trashBins,
} from "../core/utils.js"

let script = await selectScript(
  `Which script do you want to rename?`
)

let { filePath } = script

let newCommand = await arg({
  placeholder: `Enter the new script name:`,
  selected: filePath,
  validate: exists,
})

let lenientCommand = newCommand.replace(/(?<!\.js)$/, ".js")

let newFilePath = path.resolve(
  path.dirname(filePath),
  lenientCommand
)

mv(filePath, newFilePath)
await trashBins(script)

await cli("create-bin", "scripts", newFilePath)
edit(newFilePath, kenvPath())

export {}
