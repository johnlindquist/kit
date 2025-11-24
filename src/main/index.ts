performance.measure("index", "run")

import { Channel, Value } from "../core/enum.js"
import {
  run,
  cmd,
  getMainScriptPath,
  isScriptlet,
  isSnippet,
} from "../core/utils.js"
import type {
  Choice,
  Scriptlet,
  Script,
} from "../types/core.js"
import {
  mainMenu,
  scriptFlags,
  actions,
  modifiers,
  errorPrompt,
  getFlagsFromActions,
} from "../api/kit.js"
import type { Open } from "../types/packages.js"
import { parseShebang } from "../core/shebang.js"
import "./../target/path/path.js"

console.clear()

// ---------- Constants ----------

const QUICK_NEW_SCRIPT_INVALID_CHARS_REGEX =
  /[!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?]/g

// ---------- Global state ----------

let panel = ``

let isApp = false
let isPass = false
let input = ""
let focused: Choice | undefined

// ---------- Initial setup ----------

function initializeEditorFlags() {
  if (env.KIT_EDITOR === "code") return

  scriptFlags["code"] = {
    group: "Script Actions",
    name: "Open Kenv in VS Code",
    description: "Open the script's kenv in VS Code",
    shortcut: `${cmd}+shift+o`,
  }
}

initializeEditorFlags()

// ---------- Helpers: quick new script panel ----------

function normalizeScriptName(rawInput: string): string {
  return rawInput
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s/g, "-")
    .toLowerCase()
}

async function showNoMatchesPanel(input: string) {
  panel = md(`# No matches found
No matches found for <code>${input}</code>`)
  setPanel(panel)
}

async function showQuickNewScriptPanel(input: string) {
  const scriptName = normalizeScriptName(input)

  panel = md(`# Quick New Script

Create a script named <code>${scriptName}</code>
        `)
  setPanel(panel)
}

// ---------- Menu callbacks ----------

const onNoChoices = async (userInput: string, state: any) => {
  // No choices only matters when there is user input and no flagged value
  if (!userInput || state?.flaggedValue !== "") return

  const hasInvalidChars = QUICK_NEW_SCRIPT_INVALID_CHARS_REGEX.test(
    userInput
  )

  if (hasInvalidChars) {
    await showNoMatchesPanel(userInput)
    return
  }

  await showQuickNewScriptPanel(userInput)
}

const onMenuToggle = async (_input: string, state: any) => {
  if (state?.flag) return

  const menuFlags = {
    ...(scriptFlags as object),
    ...getFlagsFromActions(actions),
  }

  setFlags(menuFlags)
}

const onKeyword = async (_input: string, state: any) => {
  const { keyword, value } = state || {}

  if (!keyword || !value?.filePath) return

  preload(value.filePath)
  await run(value.filePath, `--keyword`, keyword)
}

const onSubmit = (submittedInput: string) => {
  if (!submittedInput) return
  input = submittedInput.trim()
}

const onBlur = async (_input: string, _state: any) => {
  hide()
  exit()
}

const onChoiceFocus = async (_input: string, state: any) => {
  const choice: Choice | undefined = state?.focused

  isApp =
    choice?.group === "Apps" ||
    choice?.group === "Community"

  isPass =
    choice?.group === "Pass" && !choice?.exact

  focused = choice
}

// ---------- Helpers: flags & selection ----------

function getSelectedFlag(): string | undefined {
  if (!flag) return

  return Object.keys(flag).find(f => f && !modifiers[f])
}

// ---------- Helpers: script execution branches ----------

async function launchExternalApp(scriptPath: string) {
  return await Promise.all([
    hide({
      preloadScript: getMainScriptPath(),
    }),
    (open as unknown as Open)(scriptPath),
  ])
}

function isPostfixScript(script: any): boolean {
  return Boolean((script as Script)?.postfix)
}

async function runPassScript(script: any) {
  const hardPass =
    (script as any)?.postfix || input

  if (typeof global?.flag === "object") {
    global.flag.hardPass = hardPass
  }

  return await run(
    (script as Script)?.filePath,
    "--pass",
    hardPass
  )
}

async function runStringSelection(selection: string) {
  if (selection === "kit-sponsor") {
    return await run(
      kitPath("main", "sponsor.js")
    )
  }

  const scriptPath = selection
  const [maybeScript, numarg] = scriptPath.split(
    /\s(?=\d)/
  )

  if (await isFile(maybeScript)) {
    return await run(maybeScript, numarg)
  }

  const slug = scriptPath
    .trim()
    .replace(/\s/g, "-")
    .toLowerCase()

  const scriptName = scriptPath.trim()

  return await run(
    `${kitPath("cli", "new")}.js`,
    slug,
    `--scriptName`,
    scriptName
  )
}

async function openScriptKenvInCode(script: Script) {
  return await exec(
    `open -a 'Visual Studio Code' '${path.dirname(
      path.dirname(script.filePath)
    )}'`
  )
}

async function runSettingsCommand() {
  return await run(kitPath("main", "kit.js"))
}

async function runKenvCommandForScript(
  selectedFlag: string,
  script: Script
) {
  let kenv = script.kenv || "main"

  if (selectedFlag === "kenv-term") {
    kenv = path.dirname(
      path.dirname(script.filePath)
    )
  }

  return await run(
    `${kitPath("cli", selectedFlag)}.js`,
    kenv
  )
}

async function runMenuCommand(selectedFlag: string) {
  return await run(
    `${kitPath("cli", selectedFlag)}.js`
  )
}

async function runFlagCommandOnScript(
  selectedFlag: string,
  script: Script
) {
  return await run(
    `${kitPath("cli", selectedFlag)}.js`,
    script.filePath
  )
}

async function toggleBackground(script: Script) {
  return await run(
    kitPath("cli", "toggle-background.js"),
    script.filePath
  )
}

async function editScript(script: Script) {
  return await edit(script.filePath, kenvPath())
}

async function pasteSnippet(script: Script) {
  send(Channel.STAMP_SCRIPT, script as Script)

  return await run(
    kitPath("app", "paste-snippet.js"),
    "--filePath",
    script.filePath
  )
}

async function runNamedScriptlet(script: Scriptlet) {
  const { runScriptlet } = await import("./scriptlet.js")

  updateArgs(args)
  await runScriptlet(
    script,
    script.inputs || [],
    flag
  )
}

async function runAnonymousScriptlet(
  scriptInputs: any[]
) {
  const { runScriptlet } = await import("./scriptlet.js")

  updateArgs(args)
  await runScriptlet(
    focused as Scriptlet,
    scriptInputs,
    flag
  )
}

async function runShebangScript(script: Script) {
  const shebang = parseShebang(script)
  return await sendWait(Channel.SHEBANG, shebang)
}

async function runFileScript(script: Script) {
  preload(script.filePath)

  const runArgs = Object.keys(flag || {}).map(
    f => `--${f}`
  )

  const runPromise = run(
    script.filePath,
    ...runArgs
  )

  return await runPromise
}

// ---------- Core: runScript ----------

const runScript = async (script: any) => {
  // Apps: open in external app instead of running as a script
  if (isApp && typeof script === "string") {
    return await launchExternalApp(script)
  }

  // Pass / postfix scripts
  if (isPass || isPostfixScript(script)) {
    return await runPassScript(script)
  }

  // Nothing selected
  if (
    script === Value.NoValue ||
    typeof script === "undefined"
  ) {
    console.warn("🤔 No script selected", script)
    return
  }

  // Plain string selection (e.g. new script name)
  if (typeof script === "string") {
    return await runStringSelection(script)
  }

  const shouldEdit = flag?.open
  const selectedFlag = getSelectedFlag()

  // Open kenv in VS Code
  if (selectedFlag && flag?.code) {
    return await openScriptKenvInCode(script)
  }

  // Settings
  if (selectedFlag === "settings") {
    return await runSettingsCommand()
  }

  // Kenv actions
  if (selectedFlag?.startsWith("kenv")) {
    return await runKenvCommandForScript(
      selectedFlag,
      script
    )
  }

  // Menu actions
  if (selectedFlag?.endsWith("menu")) {
    return await runMenuCommand(selectedFlag)
  }

  // Other flag actions that operate on the script file
  if (selectedFlag && !flag?.open) {
    return await runFlagCommandOnScript(
      selectedFlag,
      script
    )
  }

  // Show log window
  if (flag[modifiers.opt]) {
    return showLogWindow(script?.filePath)
  }

  // Toggle background mode
  if (script?.background) {
    return await toggleBackground(script)
  }

  // Edit script
  if (shouldEdit) {
    return await editScript(script)
  }

  // Snippets
  if (isSnippet(script)) {
    return await pasteSnippet(script)
  }

  // Scriptlet selected directly
  if (isScriptlet(script)) {
    await runNamedScriptlet(script)
    return
  }

  // Scriptlet invoked with inputs
  if (Array.isArray(script)) {
    await runAnonymousScriptlet(script)
    return
  }

  // Shebang-based script
  if ((script as Script)?.shebang) {
    return await runShebangScript(script as Script)
  }

  // Normal script file
  if (script?.filePath) {
    return await runFileScript(script)
  }

  // Fallback catch-all
  return await arg("How did you get here?")
}

// ---------- Main ----------

trace.instant({
  args: "mainMenu",
})

const script = await mainMenu({
  name: "Main",
  description: "Script Kit",
  placeholder: "Script Kit",
  enter: "Run",
  strict: false,
  flags: scriptFlags,
  onMenuToggle,
  onKeyword,
  onSubmit,
  onBlur,
  onNoChoices,
  onChoiceFocus,
  // footer: `Script Options: ${cmd}+k`,
  shortcodes: {
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
    "1": `${kitPath(
      "handler",
      "number-handler.js"
    )} 1`,
    "2": `${kitPath(
      "handler",
      "number-handler.js"
    )} 2`,
    "3": `${kitPath(
      "handler",
      "number-handler.js"
    )} 3`,
    "4": `${kitPath(
      "handler",
      "number-handler.js"
    )} 4`,
    "5": `${kitPath(
      "handler",
      "number-handler.js"
    )} 5`,
    "6": `${kitPath(
      "handler",
      "number-handler.js"
    )} 6`,
    "7": `${kitPath(
      "handler",
      "number-handler.js"
    )} 7`,
    "8": `${kitPath(
      "handler",
      "number-handler.js"
    )} 8`,
    "9": `${kitPath(
      "handler",
      "number-handler.js"
    )} 9`,
    // "0": kitPath("handler", "zero-handler.js"),
    // "?": kitPath("handler", "question-handler.js"),
  },
  actions,
  input: arg?.input || "",
})

trace.instant({
  args: "mainMenu submitted",
})

// Match original exit behavior before running anything
if (!script && Object.keys(flag).length === 0) {
  process.exit()
}

if (typeof script === "boolean" && !script) {
  exit()
}

await runScript(script)
