// Description: File Search

setName(``)

let atLeast = `Type at least 3 characters`
let selectedFile = await arg(
  {
    placeholder: "Search Files",
    footer: "Enter to open action menu",
    enter: "Open Action Menu",
  },
  async input => {
    if (!input || input === "undefined") {
      setFooter(atLeast)
      return []
    }

    if (input?.length < 3) {
      setFooter(atLeast)
      return []
    }

    setFooter(``)
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

let action = await arg<string>(
  {
    placeholder: "Selected Path Action:",
    shortcuts: [
      {
        name: "Back to Search",
        key: "left",
        bar: "right",
      },
    ],
    onLeft: async () => {
      await run(
        kitPath("main", "file-search.js"),
        selectedFile.replace(new RegExp(`${path.sep}$`), "")
      )
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
      name: "Show in Finder",
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
    await revealInFinder(selectedFile)
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
    await exec(
      `open -a 'Visual Studio Code' '${selectedFile}'`
    )
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

export {}
