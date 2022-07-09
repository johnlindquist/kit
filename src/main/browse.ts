// Description: Select a Path

setName(``)
setPrompt({ preview: "" })

let initialPath = await arg("Initial path")
if (initialPath === "~") initialPath = home()

let selectedPath = await path(initialPath)

setDescription(selectedPath)

let action = await arg<string>(
  {
    placeholder: "Selected Path Action:",
    onEscape: async () => {
      submit(``)
      await run(
        kitPath("main", "browse.js"),
        selectedPath.replace(new RegExp(`${path.sep}$`), "")
      )
    },
    onLeft: async () => {
      submit(``)
      await run(
        kitPath("main", "browse.js"),
        selectedPath.replace(new RegExp(`${path.sep}$`), "")
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
      name: "Open in Kit Editor",
      value: "editor",
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
    await exec(`open '${selectedPath}'`)
    break

  case "finder":
    await exec(`open '${path.dirname(selectedPath)}'`)
    await applescript(`
set aFile to (POSIX file "${selectedPath}") as alias
tell application "Finder" to select aFile
`)
    break

  case "info":
    await applescript(`
set aFile to (POSIX file "${selectedPath}") as alias
tell application "Finder" to open information window of aFile
`)
    break

  case "terminal":
    await exec(`open -a Terminal '${selectedPath}'`)
    break

  case "command":
    cd(selectedPath)
    setDescription(`> Run command:`)
    await exec(await arg("Enter command:"))
    break

  case "editor":
    try {
      let content = await readFile(selectedPath, "utf-8")
      content = await editor(content)
      await writeFile(selectedPath, content)
    } catch (error) {
      console.log(`Error: ${error}`)
    }
    break

  case "vscode":
    await exec(
      `open -a 'Visual Studio Code' '${selectedPath}'`
    )
    break

  case "copy":
    await copy(selectedPath)
    break

  case "move":
    setDescription("Select destination folder")
    let destFolder = await path(path.dirname(selectedPath))
    mv(selectedPath, destFolder)
    break

  case "trash":
    let yn = await arg({
      placeholder: "Are you sure?",
      hint: "[y]/[n]",
    })
    if (yn === "y") {
      await trash(selectedPath)
    }
    break
}

export {}
