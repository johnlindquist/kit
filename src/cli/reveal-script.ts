// Description: Reveal the selected script in Finder

let filePath = ""
if (typeof args[0] === "string") {
  filePath = args[0]
} else {
  let script = await selectScript(
    `Which script do you want to reveal?`
  )
  filePath = script.filePath
}
await revealFile(filePath)

export {}
