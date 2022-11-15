// Name: File Search
// Description: Search For Files then Take Actions

import {
  backToMainShortcut,
  isMac,
  isWin,
} from "../core/utils.js"

let atLeast = `Type at least 3 characters`
let selectedFile = await arg(
  {
    placeholder: "Search Files",
    enter: "Open Action Menu",
    shortcuts: [backToMainShortcut],
  },
  async input => {
    if (!input || input === "undefined") {
      setHint(atLeast)
      return []
    }
    if (input?.length < 3) {
      setHint(atLeast)
      return []
    }
    setHint(``)
    let files = await fileSearch(input)
    return files.map(p => {
      return {
        name: path.basename(p),
        description: p,
        drag: p,
        value: p,
      }
    })
  }
)
setDescription(selectedFile)
let action = await arg(
  {
    placeholder: "Selected Path Action:",
    shortcuts: [
      backToMainShortcut,
      {
        name: "Return to Search",
        key: "left",
        bar: "right",
      },
    ],
    onBack: async () => {
      await run(kitPath("main", "file-search.js"))
    },
  },
  [
    {
      name: "Open in Default App",
      value: "open",
    },
    {
      name: "Open with...",
      description:
        "Select from a list of apps to open the file with",
      value: "open-with",
    },
    {
      name: `Show in ${isMac ? "Finder" : "Explorer"}`,
      value: "finder",
    },
    {
      name: "Show Info",
      value: "info",
    },
    {
      name: "Open File Path in Terminal",
      value: "terminal",
    },
    {
      name: "Open in VS Code",
      value: "vscode",
    },
    {
      name: "Copy Path",
      value: "copy",
    },
    {
      name: "Move",
      value: "move",
    },
    {
      name: "Trash",
      value: "trash",
    },
  ]
)
switch (action) {
  case "open":
    await open(path.dirname(selectedFile))
    break
  case "open-with":
    await run(kitPath("main", "open-with.js"), selectedFile)
    break
  case "finder":
    await revealFile(selectedFile)
    break
  case "info":
    await applescript(`
set aFile to (POSIX file "${selectedFile}") as alias
tell application "Finder" to open information window of aFile
`)
    break
  case "terminal":
    let selectedDir = (await isDir(selectedFile))
      ? selectedFile
      : path.dirname(selectedFile)
    terminal(`cd '${selectedDir}'`)
    break
  case "vscode":
    if (isWin) {
      await exec(`code ${selectedFile}`)
    } else {
      await exec(
        `open -a 'Visual Studio Code' '${selectedFile}'`
      )
    }

    break
  case "copy":
    await copy(selectedFile)
    break
  case "move":
    setDescription("Select destination folder")
    let destFolder = await path(path.dirname(selectedFile))
    mv(selectedFile, destFolder)
    break
  case "trash":
    let yn = await arg({
      placeholder: "Are you sure?",
      hint: "[y]/[n]",
    })
    if (yn === "y") {
      await trash(selectedFile)
    }
    break
}
