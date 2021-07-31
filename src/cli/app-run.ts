// Description: Run the selected script
import { toggleBackground, selectScript } from "../utils.js"

setFlags({
  [""]: {
    name: "Run script",
    shortcut: "enter",
  },
  open: {
    name: "Open script in editor",
    shortcut: "cmd+o",
  },
  duplicate: {
    name: "Duplicate script",
    shortcut: "cmd+d",
  },
  rename: {
    name: "Rename script",
    shortcut: "cmd+r",
  },
  remove: {
    name: "Remove script",
    shortcut: "cmd+delete",
  },
  ["open-log"]: {
    name: `Open script log`,
    shortcut: "cmd+l",
  },
  ["share-copy"]: {
    name: "Copy script to clipboard",
    shortcut: "cmd+c",
  },
  ["share-script"]: {
    name: "Share as Gist",
    shortcut: "cmd+g",
  },
  ["share-script-as-link"]: {
    name: "Share as URL",
    shortcut: "cmd+u",
  },
  ["share-script-as-discussion"]: {
    name: "Prep for discussion",
    shortcut: "cmd+p",
  },
})

let script = await selectScript(
  `Select a script to run`,
  true,
  scripts => scripts.filter(script => !script?.exclude)
)

let shouldEdit =
  script.watch ||
  script.schedule ||
  script.system ||
  flags?.open

if (script.background) {
  toggleBackground(script)
} else if (shouldEdit) {
  await edit(script.filePath, kenvPath())
}

let flag: any = Object.keys(flags).find(Boolean)

if (flag) {
  await cli(flag, script.filePath)
} else {
  await run(script.filePath)
}

export {}
