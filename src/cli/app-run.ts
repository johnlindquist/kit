// Name: Main
// Description: Script Kit

import { Value } from "../core/enum.js"
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
  ["copy-path"]: {
    name: "Copy path of script to clipboard",
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
  ["clear-script-database"]: {
    name: `Clear script database`,
  },
  ["share-script"]: {
    name: "Share as Gist",
    shortcut: "cmd+g",
  },
  ["share-script-as-kit-link"]: {
    name: "Share as kit:// link",
    shortcut: "option+s",
  },
  ["share-script-as-link"]: {
    name: "Share as URL",
    shortcut: "cmd+u",
  },
  ["share-script-as-discussion"]: {
    name: "Share as discussion",
    shortcut: "cmd+s",
  },
  ["share-script-as-markdown"]: {
    name: "Share as Markdown",
    shortcut: "cmd+m",
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
  ["stream-deck"]: {
    name: "Prepare script for Stream Deck",
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

let onNoChoices = async input => {
  let scriptName = input.replace(/\s/g, "-").toLowerCase()

  setPreview(
    md(`# Create <code>${scriptName}</code>

Create a new script named <code>"${scriptName}"</code>
    `)
  )
}

let script = await selectScript(
  {
    placeholder: "Run Script",
    strict: false,
    onNoChoices,
    input: arg?.input || "",
  },
  true,
  scripts => scripts.filter(script => !script?.exclude)
)

if (
  script === Value.NoValue ||
  typeof script === "undefined"
) {
  console.warn(`🤔 No script selected`, script)
} else if (typeof script === "string") {
  await run(
    `${kitPath("cli", "new")}.js ${script
      .replace(/\s/g, "-")
      .toLowerCase()} --scriptName '${script}'`
  )
} else {
  let shouldEdit =
    script.watch ||
    script.schedule ||
    script.system ||
    flag?.open

  let selectedFlag: any = Object.keys(flag).find(f => {
    return f && !modifiers[f]
  })

  if (selectedFlag && !flag?.open) {
    await run(
      `${kitPath("cli", selectedFlag)}.js ${
        script.filePath
      } `
    )
  } else if (script.background) {
    await toggleBackground(script)
  } else if (shouldEdit) {
    await edit(script.filePath, kenvPath())
  } else {
    await run(
      script.filePath,
      Object.keys(flag)
        .map(f => `--${f} `)
        .join(" ")
    )
  }
}

export {}
