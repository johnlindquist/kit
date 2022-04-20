// Description: File Search

setName(``)

let selectedFile = await arg(
  {
    placeholder: "Search Files",
    footer: "Enter to open action menu",
  },
  async input => {
    if (!input || input === "undefined")
      return md(`### Type at least 2 characters`)

    if (input?.length < 3)
      return md(`### Type at least 2 characters`)

    let files = await fileSearch(input)

    return files.map(path => {
      return {
        name: path.split("/").pop(),
        description: path,
        value: path,
      }
    })
  }
)

setDescription(selectedFile)

let action = await arg<string>(
  {
    placeholder: "Selected Path Action:",
    onEscape: async () => {
      await run(
        kitPath("cli", "path-handler.js"),
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
      name: "Show in Finder",
      value: "finder",
    },
    {
      name: "Show Info",
      value: "info",
    },
    {
      name: "Open in Terminal",
      value: "terminal",
    },
    {
      name: "Run Command",
      value: "command",
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
    await exec(`open '${selectedFile}'`)
    break

  case "finder":
    await exec(`open '${path.dirname(selectedFile)}'`)
    await applescript(`
    set aFile to (POSIX file "${selectedFile}") as alias
    tell application "Finder" to select aFile
    `)
    break

  case "info":
    await applescript(`
set aFile to (POSIX file "${selectedFile}") as alias
tell application "Finder" to open information window of aFile
`)
    break

  case "terminal":
    await exec(`open -a Terminal '${selectedFile}'`)
    break

  case "command":
    cd(selectedFile)
    setDescription(`> Run command:`)
    await exec(await arg("Enter command:"))
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
