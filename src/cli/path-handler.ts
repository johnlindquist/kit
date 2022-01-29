// Description: Select a Path

setPrompt({ preview: "" })

let initialPath = await arg("Initial path")
if (initialPath === "~") initialPath = home()

let pathHandlerPathJS = kenvPath(
  "scripts",
  "path-handler.js"
)
let pathHandlerPathTS = kenvPath(
  "scripts",
  "path-handler.ts"
)

let isPathHandlerJS = await isFile(pathHandlerPathJS)
let isPathHandlerTS = await isFile(pathHandlerPathTS)

if (isPathHandlerJS) {
  await run(pathHandlerPathJS)
} else if (isPathHandlerTS) {
  await run(pathHandlerPathTS)
} else {
  let selectedPath = await path(initialPath)

  setDescription(selectedPath)

  let action = await arg<string>(
    {
      placeholder: "Selction Path Action:",
      onEscape: async () => {
        await run(
          kitPath("cli", "path-handler.js"),
          selectedPath.replace(
            new RegExp(`${path.sep}$`),
            ""
          )
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
      await exec(`open ${selectedPath}`)
      break

    case "finder":
      await exec(`open ${path.dirname(selectedPath)}`)
      await applescript(`select ${selectedPath}`)
      break

    case "info":
      await applescript(`
set aFile to (POSIX file "${selectedPath}") as alias
tell application "Finder" to open information window of aFile
`)
      break

    case "terminal":
      await exec(`open -a Terminal ${selectedPath}`)
      break

    case "command":
      cd(selectedPath)
      setDescription(`> Run command:`)
      await exec(await arg("Enter command:"))
      break

    case "vscode":
      await exec(
        `open -a "Visual Studio Code" ${selectedPath}`
      )
      break

    case "copy":
      await copy(selectedPath)
      break

    case "move":
      setDescription("Select destination folder")
      let destFolder = await path(
        path.dirname(selectedPath)
      )
      await exec(`mv ${selectedPath} ${destFolder}`)
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
}

export {}
