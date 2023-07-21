// Name: Path Browser
// Description: Select a Path
// Cache: true

import {
  escapeShortcut,
  isMac,
  isWin,
} from "../core/utils.js"

let actionFlags: {
  name: string
  description?: string
  value: string
  action?: (selectedFile: string) => Promise<void>
}[] = [
  {
    name: "Open in Default App",
    value: "open",
    action: async selectedFile => {
      await open(path.dirname(selectedFile))
    },
  },
  {
    name: "Open with...",
    description:
      "Select from a list of apps to open the file with",
    value: "open-with",
    action: async selectedFile => {
      await run(
        kitPath("main", "open-with.js"),
        selectedFile
      )
    },
  },
  {
    name: `Show in ${isMac ? "Finder" : "Explorer"}`,
    value: "finder",
    action: async selectedFile => {
      await revealFile(selectedFile)
    },
  },
  {
    name: "Show Info",
    value: "info",
    action: async selectedFile => {
      await applescript(`
  set aFile to (POSIX file "${selectedFile}") as alias
  tell application "Finder" to open information window of aFile
  `)
    },
  },
  {
    name: "Open Path in Kit Term",
    value: "kit-term",
    action: async selectedFile => {
      await term(`cd ${selectedFile}`)
    },
  },
  {
    name: "Open in Terminal",
    value: "terminal",
    action: async selectedFile => {
      if (isWin) {
        await exec(`start cmd /k "cd ${selectedFile}"`)
      } else {
        await exec(`open -a Terminal '${selectedFile}'`)
      }
    },
  },
  {
    name: "Run Command",
    value: "command",
    action: async selectedFile => {
      cd(selectedFile)
      setDescription(`> Run command:`)
      await exec(await arg("Enter command:"))
    },
  },
  {
    name: "Open in Kit Editor",
    value: "editor",
    action: async selectedFile => {
      try {
        let content = await readFile(selectedFile, "utf-8")
        content = await editor(content)
        await writeFile(selectedFile, content)
      } catch (error) {
        console.log(`Error: ${error}`)
      }
    },
  },
  {
    name: "Open in VS Code",
    value: "vscode",
    action: async selectedFile => {
      if (isMac) {
        await exec(
          `open -a 'Visual Studio Code' '${selectedFile}'`
        )
      } else {
        await exec(`code ${selectedFile}`)
      }
    },
  },
  {
    name: "Copy to...",
    value: "copy_to",
    action: async selectedFile => {
      let destination = await path({
        hint: "Select destination",
        startPath: home(),
        onlyDirs: true,
        shortcuts: [escapeShortcut],
      })
      await copyFile(
        selectedFile,
        path.resolve(
          destination,
          path.basename(selectedFile)
        )
      )
    },
  },
  {
    name: "Move",
    value: "move",
    action: async selectedFile => {
      setDescription("Select destination folder")
      let destFolder = await path(
        path.dirname(selectedFile)
      )
      mv(selectedFile, destFolder)
    },
  },
  {
    name: "Copy Path",
    value: "copy",
    action: async selectedFile => {
      await copy(selectedFile)
    },
  },
  {
    name: "Trash",
    value: "trash",
    action: async selectedFile => {
      let yn = await arg({
        placeholder: `Trash ${path.basename(
          selectedFile
        )}?`,
        hint: "[y]/[n]",
      })
      if (yn === "y") {
        await trash(selectedFile)
      }
    },
  },
]

let flags = {}
for (let flag of actionFlags) {
  flags[flag.name] = flag
}

let initialPath = args?.shift() || home()
if (initialPath === "~") initialPath = home()
let selectedPath = await path({
  flags,
  startPath: initialPath,
  resize: true,
  enter: "Open Action Menu",
  onMenuToggle: async (input, state) => {
    if (state.flag) {
      setPlaceholder("Select Action")
      setEnter("Submit")
    } else {
      setPlaceholder("Browse")
      setEnter("Open Action Menu")
    }
  },
  onSubmit: async (input, state) => {
    if (state?.focused?.miss) {
      let selectedPath = input
      let doesPathExist = await pathExists(selectedPath)
      let type = "file"
      if (!doesPathExist) {
        if (state?.focused?.value === "create-file") {
          await ensureFile(selectedPath)
        }
        if (state?.focused?.value === "create-folder") {
          type = "folder"
          await ensureDir(selectedPath)
        }
      }

      let pathChoice = {
        img: kitPath("icons", type + ".svg"),
        name: path.parse(selectedPath).base,
        value: selectedPath,
      }

      setChoices([pathChoice])
      setFlagValue(pathChoice)

      return true
    }
    if (!Boolean(state?.flag)) {
      await setFlagValue(state?.focused)
      return true
    }

    return false
  },
})

actionFlags
  .find(f => flag?.[f.name])
  ?.action?.(selectedPath)
