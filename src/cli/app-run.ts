// Description: Run the selected script
import { toggleBackground, run } from "../core/utils.js"

let modifiers = {
  cmd: "cmd",
  shift: "shift",
  opt: "opt",
  ctrl: "ctrl",
}

setFlags({
  [""]: {
    name: "Run script",
    shortcut: "enter",
  },
  open: {
    name: "Open script in editor",
    shortcut: "cmd+o",
  },
  ["share-copy"]: {
    name: "Copy script content to clipboard",
    shortcut: "cmd+c",
  },
  ["new-quick"]: {
    name: "Quick new script",
    shortcut: "cmd+n",
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
    shortcut: "cmd+shift+backspace",
  },
  ["open-script-log"]: {
    name: `Open script log`,
    shortcut: "cmd+l",
  },
  ["open-script-database"]: {
    name: `Open script database`,
    shortcut: "cmd+b",
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
    name: "Share as discussion",
    shortcut: "cmd+s",
  },
  ["change-shortcut"]: {
    name: "Change shortcut",
  },
  move: {
    name: "Move script to kenv",
    shortcut: "cmd+m",
  },
  ["refresh-scripts-db"]: {
    name: "Refresh scripts db",
    shortcut: "cmd+shift+r",
  },
  [modifiers.cmd]: {
    name: "Run script w/ cmd flag",
    shortcut: "cmd+enter",
  },
  [modifiers.shift]: {
    name: "Run script w/ shift flag",
    shortcut: "shift+enter",
  },
  [modifiers.opt]: {
    name: "Run script w/ opt flag",
    shortcut: "option+enter",
  },
  [modifiers.ctrl]: {
    name: "Run script w/ ctrl flag",
    shortcut: "ctrl+enter",
  },
})

let script = await selectScript(
  `Run script`,
  true,
  scripts => scripts.filter(script => !script?.exclude)
)

let shouldEdit =
  script.watch ||
  script.schedule ||
  script.system ||
  flag?.open

if (script.background) {
  toggleBackground(script)
} else if (shouldEdit) {
  await edit(script.filePath, kenvPath())
} else {
  let selectedFlag: any = Object.keys(flag).find(f => {
    return f && !modifiers[f]
  })
  if (selectedFlag) {
    await run(
      `${kitPath("cli", selectedFlag)}.js ${
        script.filePath
      }`
    )
  } else {
    await run(
      script.filePath,
      Object.keys(flag)
        .map(f => `--${f}`)
        .join(" ")
    )
  }
}

export {}
