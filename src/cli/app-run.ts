// Name: Main
// Description: Script Kit
// Log: false

import { Value } from "../core/enum.js"
import {
  toggleBackground,
  run,
  cmd,
  returnOrEnter,
} from "../core/utils.js"

let modifiers = {
  cmd: "cmd",
  shift: "shift",
  opt: "opt",
  ctrl: "ctrl",
}

setFlags({
  [""]: {
    name: "Run",
    description: "Run the selected script",
    shortcut: "enter",
  },
  open: {
    name: "Open",
    description: "Open the selected script in your editor",
    shortcut: `${cmd}+o`,
  },
  ["reveal-script"]: {
    name: "Reveal",
    description: "Reveal the selected script in Finder",
    shortcut: `${cmd}+shift+f`,
  },
  ["share-copy"]: {
    name: "Copy",
    description: "Copy script content to clipboard",
    shortcut: `${cmd}+c`,
  },
  ["copy-path"]: {
    name: "Copy Path",
    description: "Copy full path of script to clipboard",
  },
  duplicate: {
    name: "Duplicate",
    description: "Duplicate the selected script",
    shortcut: `${cmd}+d`,
  },
  rename: {
    name: "Rename",
    description: "Rename the selected script",
    shortcut: `${cmd}+shift+r`,
  },
  remove: {
    name: "Remove",
    description: "Delete the selected script",
    shortcut: `${cmd}+shift+backspace`,
  },
  ["open-script-log"]: {
    name: "Open Log",
    description:
      "Open the .log file for the selected script",
    shortcut: `${cmd}+l`,
  },
  ["open-script-database"]: {
    name: "Open Database",
    description: "Open the db file for the selected script",
    shortcut: `${cmd}+b`,
  },
  ["clear-script-database"]: {
    name: "Delete Database",
    description:
      "Delete the db file for the selected script",
  },
  ["share-script"]: {
    name: "Share as Gist",
    description: "Share the selected script as a gist",
    shortcut: `${cmd}+g`,
  },
  ["share-script-as-kit-link"]: {
    name: "Share as kit:// link",
    description:
      "Create a link which will install the script",
    shortcut: "option+s",
  },
  ["share-script-as-link"]: {
    name: "Share as URL",
    description:
      "Create a URL which will install the script",
    shortcut: `${cmd}+u`,
  },
  ["share-script-as-discussion"]: {
    name: "Share as GitHub Discussion",
    description:
      "Copies shareable info to clipboard and opens GitHub Discussions",
    shortcut: `${cmd}+s`,
  },
  ["share-script-as-markdown"]: {
    name: "Share as Markdown",
    description:
      "Copies script contents in fenced JS Markdown",
    shortcut: `${cmd}+m`,
  },
  ["change-shortcut"]: {
    name: "Change Shortcut",
    description:
      "Prompts to pick a new shortcut for the script",
  },
  move: {
    name: "Move Script to Kenv",
    description: "Move the script between Kit Environments",
  },
  ["stream-deck"]: {
    name: "Prepare Script for Stream Deck",
    description:
      "Create a .sh file around the script for Stream Decks",
  },
  ...(global.isWin
    ? {}
    : {
        [modifiers.cmd]: {
          name: "Run script w/ cmd flag",
          shortcut: `${cmd}+enter`,
        },
      }),
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

let panel = ``

// let submitted = false
// let onInput = input => {
//   if (input.startsWith("/")) submit("/")
//   if (input.startsWith("~")) submit("~")
//   if (input.startsWith(">")) submit(">")
//   submitted = true
// }

let onNoChoices = async (input, state) => {
  // if (submitted) return
  if (input && state.flaggedValue === "") {
    let regex = /[!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?]/g
    let invalid = regex.test(input)

    if (invalid) {
      panel = md(`# No matches found
No matches found for <code>${input}</code>`)
      setPanel(panel)
      return
    }

    let scriptName = input
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s/g, "-")
      .toLowerCase()

    panel = md(`# Create <code>${scriptName}</code>

Type <kbd>${returnOrEnter}</kbd> to create a script named <code>${scriptName}</code>
        `)
    setPanel(panel)
  }
}

/*
> terminal
~ browse home
/ browse root
' snippets
" word api
: emoji search
; app launcher
, "sticky note"
. file search
` google search
< clipboard history
0-9 calculator
? docs
*/

let script = await selectScript(
  {
    placeholder: "Run Script",
    strict: false,
    onNoChoices,
    // footer: `Script Options: ${cmd}+k`,
    onInputSubmit: {
      "=": kitPath("handler", "equals-handler.js"),
      ">": kitPath("handler", "greaterthan-handler.js"),
      "/": kitPath("handler", "slash-handler.js"),
      "~": kitPath("handler", "tilde-handler.js"),
      "'": kitPath("handler", "quote-handler.js"),
      '"': kitPath("handler", "doublequote-handler.js"),
      ";": kitPath("handler", "semicolon-handler.js"),
      ":": kitPath("handler", "colon-handler.js"),
      ".": kitPath("handler", "period-handler.js"),
      "\\": kitPath("handler", "backslash-handler.js"),
      "|": kitPath("handler", "pipe-handler.js"),
      ",": kitPath("handler", "comma-handler.js"),
      "`": kitPath("handler", "backtick-handler.js"),
      "<": kitPath("handler", "lessthan-handler.js"),
      "-": kitPath("handler", "minus-handler.js"),
      "[": kitPath("handler", "leftbracket-handler.js"),
      "1": kitPath("handler", "number-handler.js") + ` 1`,
      "2": kitPath("handler", "number-handler.js") + ` 2`,
      "3": kitPath("handler", "number-handler.js") + ` 3`,
      "4": kitPath("handler", "number-handler.js") + ` 4`,
      "5": kitPath("handler", "number-handler.js") + ` 5`,
      "6": kitPath("handler", "number-handler.js") + ` 6`,
      "7": kitPath("handler", "number-handler.js") + ` 7`,
      "8": kitPath("handler", "number-handler.js") + ` 8`,
      "9": kitPath("handler", "number-handler.js") + ` 9`,
      "0": kitPath("handler", "number-handler.js") + ` 0`,
      "?": kitPath("handler", "question-handler.js"),
    },
    onShortcutSubmit: {
      [`${cmd}+p`]: kitPath("cli", "processes.js"),
      [`${cmd}+f`]: kitPath("cli", "find.js"),
      [`${cmd}+n`]: kitPath("cli", "new-quick.js"),
      [`${cmd}+0`]: kitPath("cli", "kit-clear-prompt.js"),
    },
    //     onInput: async (input, { count }) => {
    //       if (count === 0) {
    //         let scriptName = input
    //           .replace(/[^\w\s-]/g, "")
    //           .replace(/\s/g, "-")
    //           .toLowerCase()

    //         setPanel(
    //           md(`# Create \`${scriptName}\`

    // Create a new script named \`"${scriptName}"\`
    //         `)
    //         )
    //       } else {
    //         setPanel(``)
    //       }
    //     },
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
  let [maybeScript] = script.split(" ")
  if (await isFile(maybeScript)) {
    await run(script)
  } else {
    await run(
      `${kitPath("cli", "new")}.js ${script
        .trim()
        .replace(/\s/g, "-")
        .toLowerCase()} --scriptName '${script.trim()}'`
    )
  }
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
    await mainScript()
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
