// Name: Main
// Description: Script Kit
// Placeholder: Run script
// UI: arg
// Exclude: true
// Cache: true
performance.measure("index", "run")

import { Channel, Value } from "../core/enum.js"
import {
  run,
  cmd,
  isMac,
  getMainScriptPath,
} from "../core/utils.js"
import { FlagsOptions, Script } from "../types/core.js"
import {
  mainMenu,
  scriptFlags,
  shortcuts,
  modifiers,
} from "../api/kit.js"
import { Open } from "../types/packages.js"

console.clear()

if (env.KIT_EDITOR !== "code") {
  scriptFlags["code"] = {
    group: "Script Actions",
    name: "Open Kenv in VS Code",
    description: "Open the script's kenv in VS Code",
    shortcut: `${cmd}+shift+o`,
  }
}

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
< clipboard history
0-9 calculator
? docs
*/

let isApp = false
let isPass = false
let input = ""

trace.instant({
  args: "mainMenu",
})
let script = await mainMenu({
  name: "Main",
  description: "Script Kit",
  placeholder: "Script Kit",
  enter: "Run",
  strict: false,
  flags: scriptFlags,
  onMenuToggle: async (input, state) => {
    if (!state?.flag) {
      setFlags(scriptFlags)
    }
  },
  onKeyword: async (input, state) => {
    let { keyword, value } = state
    if (keyword) {
      if (value?.filePath) {
        preload(value?.filePath)
        await run(value.filePath, `--keyword`, keyword)
      }
    }
  },

  onSubmit: i => {
    if (i) {
      input = i.trim()
    }
  },
  onBlur: async (input, state) => {
    hide()
    exit()
  },
  onNoChoices,
  onChoiceFocus: async (input, state) => {
    isApp =
      state?.focused?.group === "Apps" ||
      state?.focused?.group === "Community"
    isPass =
      state?.focused?.group === "Pass" &&
      !state?.focused?.exact
  },
  // footer: `Script Options: ${cmd}+k`,
  onInputSubmit: {
    // "=": kitPath("handler", "equals-handler.js"),
    // ">": kitPath("handler", "greaterthan-handler.js"),
    // "/": kitPath("main", "browse.js"),
    // "~": kitPath("handler", "tilde-handler.js"),
    // "'": kitPath("handler", "quote-handler.js"),
    // '"': kitPath("handler", "doublequote-handler.js"),
    // ";": kitPath("handler", "semicolon-handler.js"),
    // ":": kitPath("handler", "colon-handler.js"),
    // ".": kitPath("handler", "period-handler.js"),
    // "\\": kitPath("handler", "backslash-handler.js"),
    // "|": kitPath("handler", "pipe-handler.js"),
    // ",": kitPath("handler", "comma-handler.js"),
    // "`": kitPath("handler", "backtick-handler.js"),
    // "<": kitPath("handler", "lessthan-handler.js"),
    // "-": kitPath("handler", "minus-handler.js"),
    // "[": kitPath("handler", "leftbracket-handler.js"),
    "1": kitPath("handler", "number-handler.js") + ` 1`,
    "2": kitPath("handler", "number-handler.js") + ` 2`,
    "3": kitPath("handler", "number-handler.js") + ` 3`,
    "4": kitPath("handler", "number-handler.js") + ` 4`,
    "5": kitPath("handler", "number-handler.js") + ` 5`,
    "6": kitPath("handler", "number-handler.js") + ` 6`,
    "7": kitPath("handler", "number-handler.js") + ` 7`,
    "8": kitPath("handler", "number-handler.js") + ` 8`,
    "9": kitPath("handler", "number-handler.js") + ` 9`,
    // "0": kitPath("handler", "zero-handler.js"),
    // "?": kitPath("handler", "question-handler.js"),
  },

  shortcuts,
  input: arg?.input || "",
})

trace.instant({
  args: "mainMenu submitted",
})

if (!script) {
  await arg("Script was not selected...")
}

if (typeof script === "boolean" && !script) {
  exit()
}

// TODO: Help me clean up all these conditionals
if (isApp && typeof script === "string") {
  await Promise.all([
    hide({
      preloadScript: getMainScriptPath(),
    }),
    (open as unknown as Open)(script as string),
  ])
} else if (isPass || (script as Script)?.postfix) {
  await run(
    (script as Script)?.filePath,
    `--pass`,
    (script as any).postfix || input
  )
} else if (
  script === Value.NoValue ||
  typeof script === "undefined"
) {
  console.warn(`🤔 No script selected`, script)
} else if (typeof script === "string") {
  if (script === "kit-sponsor") {
    await run(kitPath("main", "sponsor.js"))
  } else {
    let scriptPath = script as string
    let [maybeScript, numarg] = scriptPath.split(/\s(?=\d)/)
    if (await isFile(maybeScript)) {
      await run(maybeScript, numarg)
    } else {
      await run(
        `${kitPath("cli", "new")}.js`,
        scriptPath.trim().replace(/\s/g, "-").toLowerCase(),
        `--scriptName`,
        scriptPath.trim()
      )
    }
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
    await run(
      kitPath("cli", "toggle-background.js"),
      script?.filePath
    )
  } else if (shouldEdit) {
    await edit(script.filePath, kenvPath())
  } else if ((script as Script)?.shebang) {
    await sendWait(Channel.SHEBANG, script)
  } else if (script && script?.filePath) {
    preload(script?.filePath)
    let runP = run(
      script.filePath,
      ...Object.keys(flag).map(f => `--${f}`)
    )

    await runP
  }
}

export {}
