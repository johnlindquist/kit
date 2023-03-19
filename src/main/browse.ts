// Name: Path Browser
// Description: Select a Path

import {
  backToMainShortcut,
  isMac,
  isWin,
} from "../core/utils.js"

let initialPath = args?.shift() || home()
if (initialPath === "~") initialPath = home()
let selectedPath = await path({
  startPath: initialPath,
  resize: true,
  shortcuts: [backToMainShortcut],
})
setDescription(selectedPath)
let action = await arg(
  {
    placeholder: "Selected Path Action:",
    enter: "Select",
    resize: true,
    shortcuts: [
      backToMainShortcut,
      {
        name: "Back",
        key: "left",
        bar: "right",
        onPress: async () => {
          await run(
            kitPath("main", "browse.js"),
            selectedPath.replace(
              new RegExp(`${path.sep}$`),
              ""
            )
          )
        },
      },
    ],
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
      name: "Open Path in Kit Term",
      value: "kit-term",
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
      name: "Copy to...",
      value: "copy_to",
    },
    {
      name: "Move",
      value: "move",
    },
    {
      name: "Copy Path",
      value: "copy",
    },
    {
      name: "Trash",
      value: "trash",
    },
  ]
)
switch (action) {
  case "open":
    await open(path.dirname(selectedPath))
    break
  case "open-with":
    await run(kitPath("main", "open-with.js"), selectedPath)
    break
  case "finder":
    await revealFile(selectedPath)
    break
  case "info":
    await applescript(`
set aFile to (POSIX file "${selectedPath}") as alias
tell application "Finder" to open information window of aFile
`)
    break
  case "kit-term":
    await term(`cd ${selectedPath}`)
    break
  case "terminal":
    if (isWin) {
      await exec(`start cmd /k "cd ${selectedPath}"`)
    } else {
      await exec(`open -a Terminal '${selectedPath}'`)
    }
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
    if (isMac) {
      await exec(
        `open -a 'Visual Studio Code' '${selectedPath}'`
      )
    } else {
      await exec(`code ${selectedPath}`)
    }
    break
  case "copy":
    await copy(selectedPath)
    break

  case "copy_to":
    let destination = await path({
      hint: "Select destination",
      startPath: home(),
      onlyDirs: true,
      shortcuts: [backToMainShortcut],
    })
    await copyFile(
      selectedPath,
      path.resolve(destination, path.basename(selectedPath))
    )
    break
  case "move":
    setDescription("Select destination folder")
    let destFolder = await path(path.dirname(selectedPath))
    mv(selectedPath, destFolder)
    break
  case "trash":
    let yn = await arg({
      placeholder: `Trash ${path.basename(selectedPath)}?`,
      hint: "[y]/[n]",
    })
    if (yn === "y") {
      await trash(selectedPath)
    }
    break
}
