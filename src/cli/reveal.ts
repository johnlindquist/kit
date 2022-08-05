// Description: Reveal the selected script in Finder

let filePath = await arg("Path to file to reveal")
await open(path.dirname(filePath))
await applescript(`
set aFile to (POSIX file "${filePath}") as alias
tell application "Finder" to select aFile
`)

export {}
