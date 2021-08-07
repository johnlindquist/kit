import { exists, selectScript } from "../utils.js"

let { command, filePath } = await selectScript(
  `Which script do you want to rename?`
)

let newCommand = await arg({
  placeholder: `Enter the new script name:`,
  validate: exists,
})

let lenientCommand = newCommand.replace(/(?<!\.js)$/, ".js")

let newFilePath = path.resolve(
  path.dirname(filePath),
  lenientCommand
)

mv(filePath, newFilePath)

let oldBin = path.resolve(
  path.dirname(filePath),
  "..",
  "bin",
  command
)

let newBin = path.resolve(path.dirname(oldBin), newCommand)
mv(oldBin, newBin)
edit(newFilePath, kenvPath())

export {}
