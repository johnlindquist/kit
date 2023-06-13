// Name: Main
// Description: Script Kit
// Log: false

import {
  formatDistanceToNow,
  parseISO,
} from "@johnlindquist/kit-internal/date-fns"
import {
  Stamp,
  getTimestamps,
  setScriptTimestamp,
} from "../core/db.js"
import { Channel, Value } from "../core/enum.js"
import {
  toggleBackground,
  run,
  cmd,
  isMac,
} from "../core/utils.js"
import { FlagsOptions, Script } from "../types/core.js"

let modifiers = {
  cmd: "cmd",
  shift: "shift",
  opt: "opt",
  ctrl: "ctrl",
}

console.clear()

let scriptFlags: FlagsOptions = {
  // open: {
  //   name: "Edit",
  //   description: "Open the selected script in your editor",
  //   shortcut: `${cmd}+o`,
  //   action: "right",
  // },
  // ["new-menu"]: {
  //   name: "New",
  //   description: "Create a new script",
  //   shortcut: `${cmd}+n`,
  //   action: "left",
  // },
  ["edit-script"]: {
    name: "Edit",
    description: "Open the selected script in your editor",
    preview: async (input, state) => {
      let flaggedFilePath = state?.flaggedValue?.filePath
      if (!flaggedFilePath) return

      // Get last modified time
      let { size, mtime, mtimeMs } = await stat(
        flaggedFilePath
      )
      let lastModified = new Date(mtimeMs)

      let stamps = await getTimestamps()
      let stamp = stamps.stamps.find(
        s => s.filePath === flaggedFilePath
      )

      let composeBlock = (...lines) =>
        lines.filter(Boolean).join("\n")

      let compileMessage =
        stamp?.compileMessage?.trim() || ""
      let compileStamp = stamp?.compileStamp
        ? `Last compiled: ${formatDistanceToNow(
            new Date(stamp?.compileStamp),
            { includeSeconds: true }
          )} ago`
        : ""
      let executionTime = stamp?.executionTime
        ? `Last run duration: ${stamp?.executionTime}ms`
        : ""
      let runCount = stamp?.runCount
        ? `Run count: ${stamp?.runCount}`
        : ""

      let compileBlock = composeBlock(
        compileMessage && `* ${compileMessage}`,
        compileStamp && `* ${compileStamp}`
      )

      if (compileBlock) {
        compileBlock =
          `### Compile Info\n${compileBlock}`.trim()
      }

      let executionBlock = composeBlock(
        runCount && `* ${runCount}`,
        executionTime && `* ${executionTime}`
      )

      if (executionBlock) {
        executionBlock =
          `### Execution Info\n${executionBlock}`.trim()
      }

      let lastRunBlock = ""
      if (stamp) {
        let lastRunDate = new Date(stamp.timestamp)
        lastRunBlock = `### Last Run
  - ${lastRunDate.toLocaleString()}
  - ${formatDistanceToNow(lastRunDate)} ago
  `.trim()
      }

      let modifiedBlock = `### Last Modified 
- ${lastModified.toLocaleString()}      
- ${formatDistanceToNow(lastModified)} ago`

      let info = md(
        `# Stats

#### ${flaggedFilePath}

${compileBlock}
  
${executionBlock}
  
${modifiedBlock}
  
${lastRunBlock}
  
`.trim()
      )
      return info
    },
  },
  [cmd]: {
    name: "Debug Script",
    description:
      "Open inspector. Pause on debugger statements.",
    shortcut: `${cmd}+enter`,
    flag: cmd,
  },
  [modifiers.opt]: {
    name: "Open Log Window",
    description: "Open a log window for selected script",
    shortcut: `alt+enter`,
    flag: modifiers.opt,
  },
  ["push-script"]: {
    name: "Push to Git Repo",
    description: "Push the selected script to a git repo",
  },
  ["pull-script"]: {
    name: "Pull from Git Repo",
    description: "Pull the selected script from a git repo",
  },

  ["edit-doc"]: {
    name: "Create/Edit Doc",
    description:
      "Open the selected script's markdown in your editor",
  },
  ["share"]: {
    name: "Share",
    description: "Share the selected script",
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
  ["paste-as-markdown"]: {
    name: "Paste as Markdown",
    description:
      "Paste the contents of the script as Markdown",
    shortcut: `${cmd}+shift+p`,
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
  ["reveal-script"]: {
    name: "Reveal",
    description: `Reveal the selected script in ${
      isMac ? "Finder" : "Explorer"
    }`,
    shortcut: `${cmd}+shift+f`,
  },
  ["kenv-term"]: {
    name: "Open Script Kenv in a  Terminal",
    description:
      "Open the selected script's kenv in a terminal",
  },
  ["kenv-trust"]: {
    name: "Trust Script Kenv",
    description: "Trust the selected script's kenv",
  },
  ["kenv-view"]: {
    name: "View Script Kenv",
    description: "View the selected script's kenv",
  },
  ["kenv-visit"]: {
    name: "Open Script Repo",
    description:
      "Visit the selected script's kenv in your browser",
  },
  // ["share"]: {
  //   name: "Share",
  //   description: "Share the selected script",
  //   shortcut: `${cmd}+s`,
  //   bar: "right",
  // },
  // ["share-script"]: {
  //   name: "Share as Gist",
  //   description: "Share the selected script as a gist",
  //   shortcut: `${cmd}+g`,
  // },
  // ["share-script-as-kit-link"]: {
  //   name: "Share as kit:// link",
  //   description:
  //     "Create a link which will install the script",
  //   shortcut: "option+s",
  // },
  // ["share-script-as-link"]: {
  //   name: "Share as URL",
  //   description:
  //     "Create a URL which will install the script",
  //   shortcut: `${cmd}+u`,
  // },
  // ["share-script-as-discussion"]: {
  //   name: "Share as GitHub Discussion",
  //   description:
  //     "Copies shareable info to clipboard and opens GitHub Discussions",
  // },
  // ["share-script-as-markdown"]: {
  //   name: "Share as Markdown",
  //   description:
  //     "Copies script contents in fenced JS Markdown",
  //   shortcut: `${cmd}+m`,
  // },
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
  ["open-script-log"]: {
    name: "Open Log File",
    description:
      "Open the log file for the selected script",
  },
  [modifiers.shift]: {
    name: "Run script w/ shift flag",
    shortcut: "shift+enter",
    flag: "shift",
  },
  [modifiers.ctrl]: {
    name: "Run script w/ ctrl flag",
    shortcut: "ctrl+enter",
    flag: "ctrl",
  },
  ["settings"]: {
    name: "Settings",
    description: "Open the settings menu",
    shortcut: `${cmd}+,`,
  },
}

if (env.KIT_EDITOR !== "code") {
  scriptFlags["code"] = {
    name: "Open Kenv in VS Code",
    description: "Open the script's kenv in VS Code",
    shortcut: `${cmd}+shift+o`,
  }
}

setFlags(scriptFlags)

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

    panel = md(`# Quick New Script

Create a script named <code>${scriptName}</code>
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
let excludeKenvs =
  env?.KIT_EXCLUDE_KENVS?.split(",").map(k => k.trim()) ||
  []
let script = await selectScript(
  {
    name: "Main",
    placeholder: "Run Script",
    enter: "Run",
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
      "0": kitPath("handler", "zero-handler.js"),
      "?": kitPath("handler", "question-handler.js"),
    },

    shortcuts: [
      {
        name: "New",
        key: `${cmd}+n`,
        bar: "left",
        onPress: async () => {
          await run(kitPath("cli", "new-menu.js"))
        },
      },
      {
        name: "List Processes",
        key: `${cmd}+p`,
        onPress: async () => {
          let processes = await getProcesses()
          if (
            processes.filter(p => p?.scriptPath)?.length > 1
          ) {
            await run(kitPath("cli", "processes.js"))
          }
        },
      },
      {
        name: "Find Script",
        key: `${cmd}+f`,
        onPress: async () => {
          global.setFlags({})
          await run(kitPath("cli", "find.js"))
        },
      },
      {
        name: "Reset Prompt",
        key: `${cmd}+0`,
        onPress: async () => {
          await run(kitPath("cli", "kit-clear-prompt.js"))
        },
      },
      {
        name: "Edit",
        key: `${cmd}+o`,
        onPress: async (input, { focused }) => {
          if (process?.env?.KIT_EDITOR !== "kit") {
            await hide()
          }
          await run(
            kitPath("cli", "edit-script.js"),
            focused.value.filePath
          )
          submit(false)
        },
        bar: "right",
      },
      {
        name: "Create/Edit Doc",
        key: `${cmd}+.`,
        onPress: async (input, { focused }) => {
          await run(
            kitPath("cli", "edit-doc.js"),
            focused.value.filePath
          )
          submit(false)
        },
      },
      {
        name: "Log",
        key: `${cmd}+l`,
        onPress: async (input, { focused }) => {
          await run(
            kitPath("cli", "open-script-log.js"),
            focused?.value?.filePath
          )
        },
      },
      {
        name: "Export",
        key: `${cmd}+e`,
        condition: c => !c.needsDebugger,
        onPress: async (input, { focused }) => {
          await run(
            kitPath("cli", "share.js"),
            focused?.value?.filePath
          )
        },
        bar: "right",
      },
      {
        name: "Debug",
        key: `${cmd}+enter`,
        condition: c => c.needsDebugger,
        onPress: async (input, { focused }) => {
          flag.cmd = true
          submit(focused)
        },
        bar: "right",
      },
      {
        name: "Share",
        key: `${cmd}+s`,
        onPress: async (input, { focused }) => {
          await run(
            kitPath("cli", "share-script-as-discussion.js"),
            focused?.value?.filePath
          )
        },
      },
    ],
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
  scripts =>
    scripts.filter(
      script =>
        !(
          script?.exclude ||
          excludeKenvs.includes(script?.kenv)
        )
    )
)

if (typeof script === "boolean" && !script) {
  exit()
}

if ((script as Script)?.shebang) {
  await sendWait(Channel.SHEBANG, script)
} else if (
  script === Value.NoValue ||
  typeof script === "undefined"
) {
  console.warn(`🤔 No script selected`, script)
} else if (typeof script === "string") {
  let [maybeScript, numarg] = script.split(/\s(?=\d)/)
  if (await isFile(maybeScript)) {
    await run(maybeScript, numarg)
  } else {
    await run(
      `${kitPath("cli", "new")}.js`,
      script.trim().replace(/\s/g, "-").toLowerCase(),
      `--scriptName`,
      script.trim()
    )
  }
} else {
  let shouldEdit = flag?.open

  let selectedFlag: string | undefined = Object.keys(
    flag
  ).find(f => {
    return f && !modifiers[f]
  })
  if (selectedFlag && flag?.code) {
    await exec(
      `open -a 'Visual Studio Code' '${path.dirname(
        path.dirname(script.filePath)
      )}'`
    )
  } else if (selectedFlag && selectedFlag === "settings") {
    await run(kitPath("main", "kit.js"))
  } else if (
    selectedFlag &&
    selectedFlag?.startsWith("kenv")
  ) {
    let k = script.kenv || "main"
    if (selectedFlag === "kenv-term") {
      k = path.dirname(path.dirname(script.filePath))
    }

    await run(`${kitPath("cli", selectedFlag)}.js`, k)
  } else if (
    selectedFlag &&
    selectedFlag?.endsWith("menu")
  ) {
    await run(`${kitPath("cli", selectedFlag)}.js`)
  } else if (selectedFlag && !flag?.open) {
    await run(
      `${kitPath("cli", selectedFlag)}.js`,
      script.filePath
    )
  } else if (flag[modifiers.opt]) {
    showLogWindow(script?.filePath)
  } else if (script.background) {
    await toggleBackground(script)
    await mainScript()
  } else if (shouldEdit) {
    await edit(script.filePath, kenvPath())
  } else if (script && script?.filePath) {
    let runP = run(
      script.filePath,
      ...Object.keys(flag).map(f => `--${f}`)
    )

    setScriptTimestamp({ filePath: script.filePath })

    await runP
  }
}

export {}
