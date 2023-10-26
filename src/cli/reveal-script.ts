// Description: Reveal the selected script in Finder

let { filePath } = await selectScript(
  `Which script do you want to reveal?`
)
await revealFile(filePath)

export {}
