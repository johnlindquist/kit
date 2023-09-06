// Name: File Search
// Description: Search For Files then Take Actions
// Trigger: .
// Pass: true

import {
  keywordInputTransformer,
  isMac,
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
      await open(selectedFile)
    },
  },
  {
    name: "Open with...",
    description:
      "Select from a list of apps to open the file with",
    value: "open-with",
    action: async selectedFile => {
      setFilterInput(``)
      setInput(``)
      if (flag?.input) delete flag?.input
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
  ...[
    isMac && {
      name: "Show Info",
      value: "info",
      action: async selectedFile => {
        await applescript(`
      set aFile to (POSIX file "${selectedFile}") as alias
      tell application "Finder" to open information window of aFile
      `)
      },
    },
  ],

  {
    name: "Open File Path in Terminal",
    value: "terminal",
    action: async selectedFile => {
      let selectedDir = (await isDir(selectedFile))
        ? selectedFile
        : path.dirname(selectedFile)
      terminal(`cd '${selectedDir}'`)
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
    name: "Copy Path",
    value: "copy",
    action: async selectedFile => {
      await copy(selectedFile)
    },
  },
  {
    name: "Move",
    value: "move",
    action: async selectedFile => {
      let destFolder = await path({
        startPath: path.dirname(selectedFile),
        description: `Select Destination Folder`,
      })
      mv(selectedFile, destFolder)
    },
  },
  {
    name: "Trash",
    value: "trash",
    action: async selectedFile => {
      let yn = await arg({
        placeholder: "Are you sure?",
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

let pleaseType = [
  {
    name: `Type at least 3 characters`,
    info: true,
  },
]

let transformer = keywordInputTransformer(arg?.keyword)
let selectedFile = await arg(
  {
    preventCollapse: true,
    input: arg?.pass
      ? arg.pass
      : arg?.keyword
      ? `${arg.keyword} `
      : "",
    ...(!arg?.pass && { initialChoices: pleaseType }),
    onMenuToggle: async (input, state) => {
      if (state.flag) {
        setPlaceholder("Select Action")
        setEnter("Submit")
      } else {
        setPlaceholder("Search Files")
        setEnter("Actions")
      }
    },
    onSubmit: async (input, state) => {
      if (!Boolean(state?.flag)) {
        await setFlagValue(state?.focused)
        return preventSubmit
      }
    },
    placeholder: "Search Files",
    enter: "Actions",
    shortcuts: [
      {
        key: "right",
      },
    ],
    resize: true,
    flags,
  },
  async input => {
    input = transformer(input)

    if (!input || input?.length < 3) {
      return pleaseType
    }
    let files = await fileSearch(input)

    if (files.length === 0) {
      return [
        {
          name: `No results found for ${input}`,
          info: true,
        },
      ]
    }
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

actionFlags
  .find(f => flag?.[f.name])
  ?.action?.(selectedFile)
