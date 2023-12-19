import * as os from "os"
import { pathToFileURL } from "url"
import {
  QuickScore,
  quickScore,
  createConfig,
  Options,
  ConfigOptions,
} from "quick-score"
import { formatDistanceToNow } from "@johnlindquist/kit-internal/date-fns"
import {
  Action,
  Choice,
  FlagsOptions,
  FlagsWithKeys,
  PromptConfig,
  ScoredChoice,
  Script,
} from "../types/core"
import { Channel, PROMPT } from "../core/enum.js"

import {
  kitPath,
  kenvPath,
  resolveScriptToCommand,
  run,
  getKenvs,
  groupChoices,
  formatChoices,
  parseScript,
  processInBatches,
} from "../core/utils.js"
import {
  getScripts,
  getScriptFromString,
  getUserJson,
  getTimestamps,
  Stamp,
  setUserJson,
} from "../core/db.js"

import { stripAnsi } from "@johnlindquist/kit-internal/strip-ansi"

import { Kenv } from "../types/kit"
import { Fields as TraceFields } from "chrome-trace-event"

export async function initTrace() {
  if (
    process.env.KIT_TRACE ||
    (process.env.KIT_TRACE_DATA && !global?.trace?.enabled)
  ) {
    let timestamp = Date.now()
    let { default: Trace } = await import(
      "chrome-trace-event"
    )
    let tracer = new Trace.Tracer({
      noStream: true,
    })

    await ensureDir(kitPath("trace"))

    let writeStream = createWriteStream(
      kitPath("trace", `trace-${timestamp}.json`)
    )

    tracer.pipe(writeStream)

    const tidCache = new Map()

    function updateFields(channel) {
      let tid
      if (channel) {
        let cachedTid = tidCache.get(channel)
        if (cachedTid === undefined) {
          cachedTid = Object.entries(Channel).findIndex(
            ([, value]) => value === channel
          )
          tidCache.set(channel, cachedTid)
        }
        tid = cachedTid
      }
      return tid
    }

    function createTraceFunction(
      eventType: "B" | "E" | "I"
    ) {
      return function (fields: TraceFields) {
        fields.tid = updateFields(fields?.channel) || 1
        if (!process.env.KIT_TRACE_DATA) {
          fields.args = undefined
        }
        return tracer.mkEventFunc(eventType)(fields)
      }
    }

    global.trace = {
      begin: createTraceFunction("B"),
      end: createTraceFunction("E"),
      instant: createTraceFunction("I"),
      flush: () => {
        tracer.flush()
      },
      enabled: true,
    }

    global.trace.instant({
      name: "Init Trace",
      args: {
        timestamp,
      },
    })
  }
}

global.trace ||= {
  begin: () => {},
  end: () => {},
  instant: () => {},
  flush: () => {},
  enabled: false,
}

global.isWin = os.platform().startsWith("win")
global.isMac = os.platform().startsWith("darwin")
global.isLinux = os.platform().startsWith("linux")
global.cmd = global.isMac ? "cmd" : "ctrl"

let isErrored = false
export let errorPrompt = async (error: Error) => {
  if (isErrored) {
    return
  }
  isErrored = true
  if (global.__kitAbandoned) {
    let { name } = path.parse(global.kitScript)
    let errorLog = path.resolve(
      path.dirname(path.dirname(global.kitScript)),
      "logs",
      `${name}.log`
    )

    await appendFile(errorLog, `\nAbandonned. Exiting...`)
    exit()
  }
  if (process.env.KIT_CONTEXT === "app") {
    global.warn(`☠️ ERROR PROMPT SHOULD SHOW ☠️`)
    let stackWithoutId =
      error?.stack?.replace(/\?[^:]*/g, "") ||
      "No Error Stack"
    global.warn(stackWithoutId)

    let errorFile = global.kitScript
    let line: string = "1"
    let col: string = "1"

    let secondLine = stackWithoutId.split("\n")?.[1] || ""

    // TODO: This is broken on Windows...
    if (secondLine?.match("at file://")) {
      if (isWin) {
        errorFile = path.normalize(
          secondLine
            .replace("at file:///", "")
            .replace(/:\d+/g, "")
            .trim()
        )
        ;[, , line, col] = secondLine
          .replace("at file:///", "")
          .split(":")
      } else {
        errorFile = secondLine
          .replace("at file://", "")
          .replace(/:.*/, "")
          .trim()
        ;[, line, col] = secondLine
          .replace("at file://", "")
          .split(":")
      }
    }

    // END TODO

    let script = global.kitScript.replace(/.*\//, "")
    let errorToCopy = `${error.message}\n${error.stack}`
    let dashedDate = () =>
      new Date()
        .toISOString()
        .replace("T", "-")
        .replace(/:/g, "-")
        .split(".")[0]
    let errorJsonPath = global.tmp(
      `error-${dashedDate()}.txt`
    )
    await global.writeFile(errorJsonPath, errorToCopy)

    try {
      if (global?.args.length > 0) {
        log({ args })
        args = []
      }
      await run(
        kitPath("cli", "error-action.js"),
        script,
        errorJsonPath,
        errorFile,
        line,
        col
      )
    } catch (error) {
      global.warn(error)
    }
  } else {
    global.console.log(error)
  }
}

export let outputTmpFile = async (
  fileName: string,
  contents: string
) => {
  let outputPath = path.resolve(
    global.tempdir(),
    "kit",
    fileName
  )
  await outputFile(outputPath, contents)
  return outputPath
}

export let copyTmpFile = async (
  fromFile: string,
  fileName: string
) =>
  await outputTmpFile(
    fileName,
    await global.readFile(fromFile, "utf-8")
  )

export let buildWidget = async (
  scriptPath,
  outPath = ""
) => {
  let outfile = outPath || scriptPath

  let templateContent = await readFile(
    kenvPath("templates", `widget.html`),
    "utf8"
  )

  let REACT_PATH = kitPath(
    "node_modules",
    "react",
    "index.js"
  )
  let REACT_DOM_PATH = kitPath(
    "node_modules",
    "react-dom",
    "index.js"
  )

  let REACT_CONTENT = `
  let { default: React } = await import(
    kitPath("node_modules", "react", "umd", "react.development.js")
  )
  let { default: ReactDOM } = await import(
    kitPath("node_modules", "react-dom", "umd", "react-dom.deveolpment.js")
  )
  
  let __renderToString = (x, y, z)=> Server.renderToString(React.createElement(x, y, z))  
  `

  let templateCompiler = compile(templateContent)
  let result = templateCompiler({
    REACT_PATH,
    REACT_DOM_PATH,
    REACT_CONTENT,
  })

  let contents = await readFile(outfile, "utf8")

  await writeFile(outfile, result)
}

let getMissingPackages = (e: string): string[] => {
  let missingPackage = []
  if (e.includes("Cannot find package")) {
    missingPackage = e.match(
      /(?<=Cannot find package ['"]).*(?=['"])/g
    )
  } else if (e.includes("Could not resolve")) {
    missingPackage = e.match(
      /(?<=Could not resolve ['"]).*(?=['"])/g
    )
  } else if (e.includes("Cannot find module")) {
    missingPackage = e.match(
      /(?<=Cannot find module ['"]).*(?=['"])/g
    )
  }

  return (missingPackage || [])
    .map(s => s.trim())
    .filter(Boolean)
}

global.attemptImport = async (scriptPath, ..._args) => {
  let cachedArgs = args.slice(0)
  let importResult = undefined
  try {
    global.updateArgs(_args)

    let href = pathToFileURL(scriptPath).href
    let kitImport = `${href}?uuid=${global.uuid()}.kit`
    importResult = await import(kitImport)
  } catch (error) {
    let e = error.toString()
    global.warn(e)
    if (process.env.KIT_CONTEXT === "app") {
      await errorPrompt(error)
    }
  }

  return importResult
}

global.__kitAbandoned = false
global.send = (channel: Channel, value?: any) => {
  if (global.__kitAbandoned) return null
  if (process?.send) {
    try {
      let payload = {
        pid: process.pid,
        promptId: global.__kitPromptId,
        kitScript: global.kitScript,
        channel,
        value,
      }

      global.trace.instant({
        name: `Send ${channel}`,
        channel,
        args: payload,
      })

      process.send(payload)
    } catch (e) {
      global.warn(e)
    }
  } else {
    // console.log(from, ...args)
  }
}

let _consoleLog = global.console.log.bind(global.console)
let _consoleWarn = global.console.warn.bind(global.console)
let _consoleClear = global.console.clear.bind(
  global.console
)
global.log = (...args) => {
  if (process?.send) {
    global.send(
      Channel.KIT_LOG,
      args
        .map(a =>
          typeof a != "string" ? JSON.stringify(a) : a
        )
        .join(" ")
    )
  } else {
    _consoleLog(...args)
  }
}
global.warn = (...args) => {
  if (process?.send) {
    global.send(
      Channel.KIT_WARN,
      args
        .map(a =>
          typeof a != "string" ? JSON.stringify(a) : a
        )
        .join(" ")
    )
  } else {
    _consoleWarn(...args)
  }
}
global.clear = () => {
  if (process?.send) {
    global.send(Channel.KIT_CLEAR)
  } else {
    _consoleClear()
  }
}

if (process?.send) {
  global.console.log = (...args) => {
    let log = args
      .map(a =>
        typeof a != "string" ? JSON.stringify(a) : a
      )
      .join(" ")

    global.send(Channel.CONSOLE_LOG, log)
  }

  global.console.warn = (...args) => {
    let warn = args
      .map(a =>
        typeof a != "string" ? JSON.stringify(a) : a
      )
      .join(" ")

    global.send(Channel.CONSOLE_WARN, warn)
  }

  global.console.clear = () => {
    global.send(Channel.CONSOLE_CLEAR)
  }

  global.console.error = (...args) => {
    let error = args
      .map(a =>
        typeof a != "string" ? JSON.stringify(a) : a
      )
      .join(" ")

    global.send(Channel.CONSOLE_ERROR, error)
  }

  global.console.info = (...args) => {
    let info = args
      .map(a =>
        typeof a != "string" ? JSON.stringify(a) : a
      )
      .join(" ")

    global.send(Channel.CONSOLE_INFO, info)
  }
}

global.dev = async data => {
  await global.sendWait(Channel.DEV_TOOLS, data)
}
global.devTools = global.dev

global.showImage = async (html, options) => {
  await global.widget(
    md(`## \`showImage\` is Deprecated

Please use the new \`widget\` function instead.

[https://github.com/johnlindquist/kit/discussions/745](https://github.com/johnlindquist/kit/discussions/745)
`)
  )
  // global.send(Channel.SHOW, { options, html })
}

global.setPlaceholder = text => {
  global.send(Channel.SET_PLACEHOLDER, stripAnsi(text))
}

global.setEnter = async text => {
  global.send(Channel.SET_ENTER, text)
}

global.main = async (scriptPath: string, ..._args) => {
  let kitScriptPath = kitPath("main", scriptPath) + ".js"
  return await global.attemptImport(kitScriptPath, ..._args)
}

global.lib = async (lib: string, ..._args) => {
  let libScriptPath =
    path.resolve(global.kitScript, "..", "..", "lib", lib) +
    ".js"
  return await global.attemptImport(libScriptPath, ..._args)
}

global.cli = async (cliPath, ..._args) => {
  let cliScriptPath = kitPath("cli", cliPath) + ".js"

  return await global.attemptImport(cliScriptPath, ..._args)
}

global.setup = async (setupPath, ..._args) => {
  global.setPlaceholder(`>_ setup: ${setupPath}...`)
  let setupScriptPath =
    kitPath("setup/" + setupPath) + ".js"
  return await global.attemptImport(
    setupScriptPath,
    ..._args
  )
}

global.kenvTmpPath = (...parts) => {
  let command = resolveScriptToCommand(global.kitScript)
  let scriptTmpDir = kenvPath("tmp", command, ...parts)

  mkdir("-p", path.dirname(scriptTmpDir))
  return scriptTmpDir
}

global.tmpPath = (...parts) => {
  let command = global?.kitScript
    ? resolveScriptToCommand(global.kitScript)
    : ""

  let tmpCommandDir = global.path.resolve(
    os.tmpdir(),
    "kit",
    command
  )

  let scriptTmpDir = global.path.resolve(
    tmpCommandDir,
    ...parts
  )

  let kenvTmpCommandPath = kenvPath("tmp", command)

  global.ensureDirSync(tmpCommandDir)
  // symlink to kenvPath("command")
  global.ensureSymlink(tmpCommandDir, kenvTmpCommandPath)
  return scriptTmpDir
}
/**
 * @deprecated use `tmpPath` instead
 */
global.tmp = global.tmpPath
global.inspect = async (data, fileName) => {
  let dashedDate = () =>
    new Date()
      .toISOString()
      .replace("T", "-")
      .replace(/:/g, "-")
      .split(".")[0]

  let formattedData = data
  let tmpFullPath = ""

  if (typeof data !== "string") {
    formattedData = JSON.stringify(data, null, "\t")
  }

  if (fileName) {
    tmpFullPath = global.tmpPath(fileName)
  } else if (typeof data === "object") {
    tmpFullPath = global.tmpPath(`${dashedDate()}.json`)
  } else {
    tmpFullPath = global.tmpPath(`${dashedDate()}.txt`)
  }

  await global.writeFile(tmpFullPath, formattedData)

  await global.edit(tmpFullPath)
}

global.compileTemplate = async (template, vars) => {
  let templateContent = await global.readFile(
    kenvPath("templates", template),
    "utf8"
  )
  let templateCompiler = global.compile(templateContent)
  return templateCompiler(vars)
}

global.currentOnTab = null
global.onTabs = []
global.onTabIndex = 0
global.onTab = (name, tabFunction) => {
  let fn = async (...args) => {
    await tabFunction(...args)
    finishScript()
  }
  global.onTabs.push({ name, fn })
  if (global.flag?.tab) {
    if (global.flag?.tab === name) {
      let tabIndex = global.onTabs.length - 1
      global.onTabIndex = tabIndex
      global.send(Channel.SET_TAB_INDEX, tabIndex)
      global.currentOnTab = fn()
    }
  } else if (global.onTabs.length === 1) {
    global.onTabIndex = 0
    global.send(Channel.SET_TAB_INDEX, 0)
    global.currentOnTab = fn()
  }
}

global.kitPrevChoices = []

global.groupChoices = groupChoices
global.formatChoices = formatChoices

global.addChoice = async (choice: string | Choice) => {
  if (typeof choice !== "object") {
    choice = {
      name: String(choice),
      value: String(choice),
    }
  }

  choice.id ||= global.uuid()
  return await global.sendWait(Channel.ADD_CHOICE, choice)
}

global.appendChoices = async (
  choices: string[] | Choice[]
) => {
  return await global.sendWait(
    Channel.APPEND_CHOICES,
    choices
  )
}

// TODO: Add an option to avoid sorting
global.createChoiceSearch = async (
  choices: Choice[],
  config: Partial<
    Omit<Options, "keys"> &
      ConfigOptions & { keys: string[] }
  > = {
    minimumScore: 0.3,
    maxIterations: 3,
    keys: ["name"],
  }
) => {
  if (!config?.minimumScore) config.minimumScore = 0.3
  if (!config?.maxIterations) config.maxIterations = 3
  if (config?.keys && Array.isArray(config.keys)) {
    config.keys = config.keys.map(key => {
      if (key === "name") return "slicedName"
      if (key === "description") return "slicedDescription"
      return key
    })
  }

  let formattedChoices = await global.___kitFormatChoices(
    choices
  )
  function scorer(
    string: string,
    query: string,
    matches: number[][]
  ) {
    return quickScore(
      string,
      query,
      matches as any,
      undefined,
      undefined,
      createConfig(config)
    )
  }

  const keys = (config?.keys || ["slicedName"]).map(
    name => ({
      name,
      scorer,
    })
  )

  let qs = new QuickScore<Choice>(formattedChoices, {
    keys,
    ...config,
  })

  return (query: string) => {
    let result = qs.search(query) as ScoredChoice[]
    if (result.find(c => c?.item?.group)) {
      let createScoredChoice = (
        item: Choice
      ): ScoredChoice => {
        return {
          item,
          score: 0,
          matches: {},
          _: "",
        }
      }
      const groups: Set<string> = new Set()
      const keepGroups: Set<string> = new Set()
      const filteredBySearch: ScoredChoice[] = []

      // Build a map for constant time access
      const resultMap = new Map(
        result.map(r => [r.item.id, r])
      )

      for (const choice of formattedChoices) {
        if (choice?.skip) {
          const scoredSkip = createScoredChoice(choice)
          filteredBySearch.push(scoredSkip)
          if (choice?.group) groups.add(choice.group)
        } else {
          const scored = resultMap.get(choice?.id)
          if (scored) {
            filteredBySearch.push(scored)
            if (choice?.group && groups.has(choice.group)) {
              keepGroups.add(choice.group)
            }
          }
        }
      }

      result = filteredBySearch.filter(sc => {
        if (sc?.item?.skip) {
          if (!keepGroups.has(sc?.item?.group)) return false
        }

        return true
      })
    }

    return result
  }
}

global.setScoredChoices = async (
  choices: ScoredChoice[]
) => {
  return await global.sendWait(
    Channel.SET_SCORED_CHOICES,
    choices
  )
}

global.___kitFormatChoices = async (
  choices,
  className = ""
) => {
  if (!Array.isArray(choices)) return choices
  let formattedChoices = formatChoices(choices, className)
  let { __currentPromptConfig } = global as any
  let { shortcuts: globalShortcuts } =
    __currentPromptConfig || {}

  if (globalShortcuts && choices?.[0]) {
    let shortcuts = globalShortcuts.filter(shortcut => {
      if (shortcut?.condition) {
        return shortcut.condition(choices?.[0])
      }
      return true
    })

    global.send(Channel.SET_SHORTCUTS, shortcuts)
  }
  global.kitPrevChoices = formattedChoices

  global.setLoading(false)
  return formattedChoices
}

global.setChoices = async (choices, config) => {
  let formattedChoices = await global.___kitFormatChoices(
    choices,
    config?.className || ""
  )
  global.send(Channel.SET_CHOICES, {
    choices: formattedChoices,
    skipInitialSearch: config?.skipInitialSearch || false,
    inputRegex: config?.inputRegex || "",
    generated: Boolean(config?.generated),
  })
}

global.flag ||= {}
global.prepFlags = (
  flagsOptions: FlagsOptions
): FlagsOptions => {
  global.kitFlagsAsChoices = []
  for (let key of Object.keys(global?.flag)) {
    delete global?.flag?.[key]
  }

  if (
    !flagsOptions ||
    Object.entries(flagsOptions)?.length === 0
  ) {
    return false
  }

  let validFlags = {
    sortChoicesKey:
      (flagsOptions as FlagsWithKeys)?.sortChoicesKey || [],
    order: (flagsOptions as FlagsWithKeys)?.order || [],
  }
  let currentFlags = Object.entries(flagsOptions)
  for (let [key, value] of currentFlags) {
    if (key === "order") continue
    if (key === "sortChoicesKey") continue

    validFlags[key] = {
      name: value?.name || key,
      group: value?.group || "Actions",
      shortcut: value?.shortcut || "",
      description: value?.description || "",
      value: key,
      bar: value?.bar || "",
      preview: value?.preview || "",
      hasAction: Boolean(value?.onAction),
    }
  }

  global.kitFlagsAsChoices = currentFlags.map(
    ([key, value]) => {
      return {
        id: key,
        group: value?.group || "Actions",
        name: value?.name || key,
        value: key,
        description: value?.description || "",
        preview: value?.preview || `<div></div>`,
        shortcut: value?.shortcut || "",
        onAction: value?.onAction || null,
      }
    }
  )

  return validFlags
}

global.setFlags = (flags: FlagsOptions) => {
  global.send(Channel.SET_FLAGS, global.prepFlags(flags))
}

export let getFlagsFromActions = (
  actions: PromptConfig["actions"]
) => {
  let flags: FlagsOptions = {}
  if (Array.isArray(actions)) {
    for (let action of actions) {
      if (typeof action === "string") {
        action = { name: action, flag: action }
      }
      flags[action.flag || action.name] = {
        flag: action.flag || action.name,
        ...action,
        hasAction: action?.onAction ? true : false,
        bar: action?.visible ? "right" : "",
      }
    }
  }

  return flags
}

global.setActions = (actions: Action[]) => {
  let flags = getFlagsFromActions(actions)
  setFlags(flags)
}

global.setFlagValue = (value: any) => {
  return global.sendWait(Channel.SET_FLAG_VALUE, value)
}

global.hide = async (hideOptions = {}) => {
  await global.sendWait(Channel.HIDE_APP, hideOptions)
  if (process.env.KIT_HIDE_DELAY) {
    await wait(-process.env.KIT_HIDE_DELAY)
  }
}

global.show = async () => {
  await global.sendWait(Channel.SHOW_APP)
}

global.blur = async () => {
  await global.sendWait(Channel.BLUR_APP, {})
}

global.run = run

let wrapCode = (
  html: string,
  containerClass: string,
  codeStyles = ""
) => {
  return `<pre class="${containerClass}">
  <style type="text/css">
      code{
        font-size: 0.9rem !important;
        width: 100%;
        ${codeStyles}
      }
      pre{
        display: flex;
      }
      p{
        margin-bottom: 1rem;
      }
  </style>
  <code>
${html.trim()}
  </code>
</pre>`
}

let getLanguage = (language: string) => {
  if (language.includes("python")) return "python"
  if (language.includes("ruby")) return "ruby"
  if (language.includes("php")) return "php"
  if (language.includes("perl")) return "perl"

  switch (language) {
    case "node":
      language = "javascript"
      break

    case "sh":
    case "zsh":
      language = "bash"
      break

    case "irb":
      language = "ruby"
      break

    case "raku":
    case "perl6":
      language = "perl"
      break

    case "ps1":
    case "pwsh":
      language = "powershell"
      break

    case "tclsh":
      language = "tcl"
      break

    case "erl":
    case "escript":
      language = "erlang"
      break

    case "iex":
      language = "elixir"
      break

    case "rscript":
    case "r":
      language = "r"
      break

    case "ghci":
    case "hugs":
      language = "haskell"
      break

    default:
      // If the language is not recognized or already has the correct syntax, leave it as is.
      break
  }

  return language
}

export let highlightJavaScript = async (
  filePath: string,
  shebang = ""
): Promise<string> => {
  let isPathAFile = await isFile(filePath)
  let contents = ``
  if (isPathAFile) {
    contents = await readFile(filePath, "utf8")
  } else {
    contents = filePath.trim()
  }

  let { default: highlight } =
    global.__kitHighlight || (await import("highlight.js"))
  if (!global.__kitHighlight)
    global.__kitHighlight = { default: highlight }
  let highlightedContents = ``
  if (shebang) {
    // split shebang into command and args
    let [command, ...shebangArgs] = shebang.split(" ")

    let language = command.endsWith("env")
      ? shebangArgs?.[0]
      : command.split("/").pop() || "bash"

    language = getLanguage(language)
    highlightedContents = highlight.highlight(contents, {
      language,
    }).value
  } else {
    highlightedContents = highlight.highlight(contents, {
      language: "javascript",
    }).value
  }

  let wrapped = wrapCode(highlightedContents, "px-5")
  return wrapped
}

function buildScriptConfig(
  message: string | PromptConfig
): PromptConfig {
  let scriptsConfig =
    typeof message === "string"
      ? { placeholder: message }
      : message
  scriptsConfig.scripts = true
  scriptsConfig.resize = false
  scriptsConfig.enter ||= "Select"
  scriptsConfig.preventCollapse = true
  return scriptsConfig
}

async function getScriptResult(
  script: Script | string,
  message: string | PromptConfig
): Promise<Script> {
  if (
    typeof script === "string" &&
    (typeof message === "string" ||
      message?.strict === true)
  ) {
    return await getScriptFromString(script)
  } else {
    return script as Script //hmm...
  }
}

export let getApps = async () => {
  let { choices } = await readJson(
    kitPath("db", "apps.json")
  ).catch(error => ({
    choices: [],
  }))

  if (choices.length === 0) return []

  let groupedApps = choices.map(c => {
    c.group = "Apps"
    return c
  })

  return groupedApps
}

let groupScripts = scripts => {
  let excludeGroups =
    env?.KIT_EXCLUDE_KENVS?.split(",").map(k => k.trim()) ||
    []

  return groupChoices(scripts, {
    groupKey: "kenv",
    missingGroupName: "Main",
    order: process?.env?.KIT_MAIN_ORDER
      ? process?.env?.KIT_MAIN_ORDER?.split(",")
          .filter(Boolean)
          .map(s => s.trim())
      : ["Favorite", "Main", "Apps"],
    endOrder: process?.env?.KIT_MAIN_END_ORDER
      ? process?.env?.KIT_MAIN_END_ORDER?.split(",").filter(
          Boolean
        )
      : ["Pass"],
    recentKey: "timestamp",
    excludeGroups,
    recentLimit: process?.env?.KIT_RECENT_LIMIT
      ? parseInt(process.env.KIT_RECENT_LIMIT, 10)
      : 3,
    hideWithoutInput: ["Apps"],
    tagger: (s: any) => {
      if (!s.tag) {
        s.tag = ``
        if (s?.friendlyShortcut) {
          s.tag = s.friendlyShortcut
        }

        if (s?.trigger) {
          s.tag = `${s?.tag && ` ${s?.tag} `}trigger: ${
            s.trigger
          }`
        }

        if (s?.keyword) {
          s.tag = `${s?.tag && ` ${s?.tag} `}keyword: ${
            s.keyword
          }`
        }

        if (s.snippet) {
          s.tag = `${s?.tag && ` ${s?.tag} `}snippet ${
            s.snippet
          }`
        }

        if (
          typeof s?.pass === "string" &&
          s?.pass !== "true"
        ) {
          s.tag = `${s?.tag && ` ${s?.tag} `}postfix: ${
            s.pass
          }`
        }

        s.tag = s.tag.trim()
      }
    },
  })
}

let processedScripts = []
export let getProcessedScripts = async () => {
  if (
    global.__kitScriptsFromCache &&
    processedScripts.length
  )
    return processedScripts

  trace.begin({
    name: "getScripts",
  })
  let scripts: Script[] = await getScripts(true)
  trace.end({
    name: "getScripts",
  })

  trace.begin({
    name: "getTimestamps",
  })
  let timestampsDb = await getTimestamps()
  trace.end({
    name: "getTimestamps",
  })

  global.__kitScriptsFromCache = true

  trace.begin({
    name: "processedScripts = await Promise.all",
  })
  processedScripts = await processInBatches(
    scripts.map(processScript(timestampsDb.stamps)),
    10
  )

  trace.end({
    name: "processedScripts = await Promise.all",
  })

  return scripts
}

export let getGroupedScripts = async () => {
  trace.begin({
    name: "getProcessedScripts",
  })
  let processedscripts = await getProcessedScripts()
  trace.end({
    name: "getProcessedScripts",
  })

  let apps = (await getApps()).map(a => {
    a.ignoreFlags = true
    return a
  })
  if (apps.length) {
    processedscripts = processedscripts.concat(apps)
  }

  let kitScripts = [
    // kitPath("cli", "new.js"),
    kitPath("cli", "new-menu.js"),
    kitPath("cli", "new-snippet.js"),
    kitPath("cli", "share.js"),
    kitPath("cli", "find.js"),
    kitPath("main", "kit.js"),
    kitPath("cli", "processes.js"),
    kitPath("cli", "kenv-manage.js"),
    kitPath("main", "file-search.js"),
    // kitPath("main", "google.js"),
  ]

  if (env?.KIT_LOGIN) {
    kitScripts.push(kitPath("main", "account-v2.js"))
  } else {
    kitScripts.push(kitPath("main", "sign-in.js"))
  }

  if (env?.KIT_PRO !== "true") {
    kitScripts.push(kitPath("main", "sponsor.js"))
  }

  kitScripts = kitScripts.concat([
    kitPath("main", "api.js"),
    kitPath("main", "guide.js"),
    kitPath("main", "tips.js"),
    // kitPath("main", "suggest.js"),
    kitPath("main", "datamuse.js"),
    kitPath("main", "giphy.js"),
    kitPath("main", "browse.js"),
    kitPath("main", "app-launcher.js"),
    // kitPath("main", "account.js"),
    kitPath("main", "dev.js"),
    kitPath("main", "hot.js"),
    kitPath("main", "snippets.js"),
    kitPath("main", "term.js"),
    kitPath("main", "sticky.js"),
    kitPath("main", "spell.js"),
    kitPath("main", "define.js"),
    kitPath("main", "rhyme.js"),
    kitPath("cli", "manage-npm.js"),
    kitPath("main", "clipboard-history.js"),
    kitPath("main", "emoji.js"),

    kitPath("pro", "theme-selector.js"),
  ])

  if (isMac) {
    kitScripts.push(kitPath("main", "system-commands.js"))
    kitScripts.push(kitPath("main", "focus-window.js"))

    if (!Boolean(env?.KIT_ACCESSIBILITY)) {
      kitScripts.push(kitPath("main", "accessibility.js"))
    }
  }

  trace.begin({
    name: "parsedKitScripts",
  })
  let parsedKitScripts = await processInBatches(
    kitScripts.map(async scriptPath => {
      let script = await parseScript(scriptPath)

      script.group = "Kit"
      script.ignoreFlags = true
      script.preview = `<div></div>`

      processPreviewPath(script)

      return script
    }),
    5
  )

  trace.end({
    name: "parsedKitScripts",
  })

  processedscripts = processedscripts.concat(
    parsedKitScripts
  )

  // let getHot = async () => {
  //   let hotPath = kitPath("data", "hot.json")
  //   if (await isFile(hotPath)) {
  //     return await readJson(hotPath)
  //   }

  //   return []
  // }

  // let loadHotChoices = async () => {
  //   try {
  //     let hot = await getHot()

  //     return hot.map(choice => {
  //       choice.preview = async () => {
  //         if (choice?.body) {
  //           return await highlight(choice?.body)
  //         }

  //         return ""
  //       }

  //       choice.group = "Community"
  //       choice.enter = "View Discussion"
  //       choice.lastGroup = true

  //       return choice
  //     })
  //   } catch (error) {
  //     return [error.message]
  //   }
  // }

  // let communityScripts = await loadHotChoices()

  // processedscripts = processedscripts.concat(
  //   communityScripts
  // )

  trace.begin({
    name: "groupScripts",
  })
  let groupedScripts = groupScripts(processedscripts)
  trace.end({
    name: "groupScripts",
  })

  groupedScripts = groupedScripts.map(s => {
    if (s.group === "Pass") {
      s.ignoreFlags = true
    }

    return s
  })

  return groupedScripts
}

export let mainMenu = async (
  message: string | PromptConfig = "Select a script"
): Promise<Script | string> => {
  setShortcuts([
    { name: "New Menu", key: `${cmd}+shift+n` },
    { name: "New", key: `${cmd}+n`, bar: "left" },
    { name: "List Processes", key: `${cmd}+p` },
    { name: "Find Script", key: `${cmd}+f` },
    { name: "Reset Prompt", key: `${cmd}+0` },
    { name: "Edit", key: "cmd+o", bar: "right" },
    { name: "Create/Edit Doc", key: `${cmd}+.` },
    { name: "Log", key: `${cmd}+l` },
    { name: "Share", key: `${cmd}+s`, bar: "right" },
    { name: "Exit", key: `${cmd}+w`, bar: "" },
  ])

  // if (global.trace) {
  //   global.trace.addBegin({
  //     name: "buildScriptConfig",
  //     tid: 0,
  //     args: `Build main menu`,
  //   })
  // }

  trace.begin({
    name: "buildScriptConfig",
  })

  let scriptsConfig = buildScriptConfig(message)

  trace.end({
    name: "buildScriptConfig",
  })

  scriptsConfig.keepPreview = true

  // We preload from an in-memory cache, then replace with the actual scripts
  global.__kitScriptsFromCache = false

  trace.begin({
    name: "getGroupedScripts",
  })
  let groupedScripts = await getGroupedScripts()
  trace.end({
    name: "getGroupedScripts",
  })

  let script = await global.arg(
    scriptsConfig,
    groupedScripts
  )
  return await getScriptResult(script, message)
}

export let selectScript = async (
  message: string | PromptConfig = "Select a script",
  fromCache = true,
  xf = (x: Script[]) => x,
  ignoreKenvPattern = /^ignore$/
): Promise<Script> => {
  let scripts: Script[] = xf(
    await getScripts(fromCache, ignoreKenvPattern)
  )

  let groupedScripts = groupScripts(scripts)

  let scriptsConfig = buildScriptConfig(message)
  scriptsConfig.keepPreview = true

  let script = await global.arg(
    scriptsConfig,
    groupedScripts
  )
  return await getScriptResult(script, message)
}

export let processPreviewPath = (s: Script) => {
  if (s.previewPath) {
    s.preview = async () => {
      let previewPath = getPreviewPath(s)

      let preview = `<div></div>`

      if (await isFile(previewPath)) {
        preview = md(await readFile(previewPath, "utf8"))
      }

      return preview
    }
  }
}

export let processScriptPreview =
  (script: Script, infoBlock: string = "") =>
  async () => {
    let previewPath = getPreviewPath(script)
    let preview = ``

    if (await isFile(previewPath)) {
      preview = await processWithPreviewFile(
        script,
        previewPath,
        infoBlock
      )
    } else if (typeof script?.preview === "string") {
      preview = await processWithStringPreview(
        script,
        infoBlock
      )
    } else {
      preview = await processWithNoPreview(
        script,
        infoBlock
      )
    }

    return preview
  }

// TODO: The logic around scripts + stats/timestamps is confusing. Clean it up.
export let processScript =
  (timestamps: Stamp[] = []) =>
  async (s: Script): Promise<Script> => {
    let stamp = timestamps.find(
      t => t.filePath === s.filePath
    )

    let infoBlock = ``
    if (stamp) {
      s.compileStamp = stamp.compileStamp
      s.compileMessage = stamp.compileMessage
      s.timestamp = stamp.timestamp

      if (stamp.compileMessage && stamp.compileStamp) {
        infoBlock = `~~~
⚠️ Last compiled ${formatDistanceToNow(
          new Date(stamp.compileStamp)
        )} ago

${stamp.compileMessage}
~~~

<p/>

`
      }
    }
    s.preview = processScriptPreview(s, infoBlock)

    return s
  }

export let getPreviewPath = (s: Script): string => {
  if (s?.previewPath) {
    return path.normalize(
      s.previewPath
        .replace("~", home())
        .replace("$KIT", kitPath())
    )
  }
  return path.resolve(
    path.dirname(path.dirname(s.filePath)),
    "docs",
    path.parse(s.filePath).name + ".md"
  )
}

export let processWithPreviewFile = async (
  s: Script,
  previewPath: string,
  infoBlock: string
): Promise<string> => {
  let processedPreview = ``
  try {
    let preview = await readFile(previewPath, "utf8")
    let content = await highlightJavaScript(
      s.filePath,
      s.shebang
    )
    processedPreview = md(infoBlock + preview) + content
  } catch (error) {
    processedPreview = md(
      `Could not find doc file ${previewPath} for ${s.name}`
    )
    warn(
      `Could not find doc file ${previewPath} for ${s.name}`
    )
  }

  return processedPreview
}

export let processWithStringPreview = async (
  s: Script,
  infoBlock: string
) => {
  let processedPreview = ``
  if (s?.preview === "false") {
    processedPreview = `<div/>`
  } else {
    try {
      let content = await readFile(
        path.resolve(
          path.dirname(s.filePath),
          s?.preview as string
        ),
        "utf-8"
      )
      processedPreview = infoBlock
        ? md(infoBlock)
        : `` + (await highlight(content))
    } catch (error) {
      processedPreview = `Error: ${error.message}`
    }
  }

  return processedPreview
}

export let processWithNoPreview = async (
  s: Script,
  infoBlock: string
): Promise<string> => {
  let processedPreview = ``
  let preview = await readFile(s.filePath, "utf8")

  if (preview.startsWith("/*") && preview.includes("*/")) {
    let index = preview.indexOf("*/")
    let content = preview.slice(2, index).trim()
    let markdown = md(infoBlock + content)
    let js = await highlightJavaScript(
      preview.slice(index + 2).trim()
    )
    return markdown + js
  }

  let markdown = md(`# ${s.name}

~~~
${path.basename(s?.filePath)}
~~~

<div class="pb-2.5"></div>

${s?.description ? s.description : ""}
${s?.note ? `> ${s.note}` : ""}
`)

  let content = await highlightJavaScript(
    preview,
    s?.shebang || ""
  )

  processedPreview =
    markdown + (infoBlock ? md(infoBlock) : `` + content)
  return processedPreview
}

global.selectScript = selectScript

export let selectKenv = async (
  config = {
    placeholder: "Select a Kenv",
    enter: "Select Kenv",
  } as PromptConfig,
  // ignorePattern ignores examples and sponsors
  ignorePattern = /^(examples|sponsors)$/
) => {
  let homeKenv = {
    name: "main",
    description: `Your main kenv: ${kenvPath()}`,
    value: {
      name: "main",
      dirPath: kenvPath(),
    },
  }
  let selectedKenv: Kenv | string = homeKenv.value

  let kenvs = await getKenvs(ignorePattern)
  if (kenvs.length) {
    let kenvChoices = [
      homeKenv,
      ...kenvs.map(p => {
        let name = path.basename(p)
        return {
          name,
          description: p,
          value: {
            name,
            dirPath: p,
          },
        }
      }),
    ]

    selectedKenv = await global.arg(config, kenvChoices)

    if (typeof selectedKenv === "string") {
      return kenvChoices.find(
        c =>
          c.value.name === selectedKenv ||
          path.resolve(c.value.dirPath) ===
            path.resolve(selectedKenv as string)
      ).value
    }
  }
  return selectedKenv as Kenv
}

global.selectKenv = selectKenv

global.highlight = async (
  markdown: string,
  containerClass: string = "p-5 leading-loose",
  injectStyles: string = ``
) => {
  let { default: highlight } =
    global.__kitHighlight || (await import("highlight.js"))
  if (!global.__kitHighlight)
    global.__kitHighlight = { default: highlight }

  let renderer = new marked.Renderer()
  renderer.paragraph = p => {
    // Convert a tag with href .mov, .mp4, or .ogg video links to video tags
    if (p.match(/<a href=".*\.(mov|mp4|ogg)">.*<\/a>/)) {
      let url = p.match(/href="(.*)"/)[1]
      return `<video controls src="${url}" style="max-width: 100%;"></video>`
    }

    return `<p>${p}</p>`
  }

  renderer.text = text => {
    return `<span>${text}</span>`
  }
  global.marked.setOptions({
    renderer,
    highlight: function (code, lang) {
      const language = highlight.getLanguage(lang)
        ? lang
        : "plaintext"
      return highlight.highlight(code, { language }).value
    },
    langPrefix: "hljs language-", // highlight.js css expects a top-level 'hljs' class.
    pedantic: false,
    gfm: true,
    breaks: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
    xhtml: false,
  })

  let highlightedMarkdown = global.marked(markdown)

  let result = `<div class="${containerClass}">
  <style>
  p{
    margin-bottom: 1rem;
  }
  li{
    margin-bottom: .25rem;
  }
  ${injectStyles}
  </style>
  ${highlightedMarkdown}
</div>`

  return result
}

global.setTab = (tabName: string) => {
  let i = global.onTabs.findIndex(
    ({ name }) => name === tabName
  )
  global.send(Channel.SET_TAB_INDEX, i)
  global.onTabs[i].fn()
}

global.execLog = (command: string, logger = global.log) => {
  let writeableStream = new Writable()
  writeableStream._write = (chunk, encoding, next) => {
    logger(chunk.toString().trim())
    next()
  }

  let child = exec(command, {
    all: true,
    shell:
      process?.env?.KIT_SHELL ||
      (process.platform === "win32" ? "cmd.exe" : "zsh"),
  })

  child.all.pipe(writeableStream)

  return child
}

// global.projectPath = (...args) => {
//   throw new Error(
//     `Script not loaded. Can't use projectPath() until a script is imported`
//   )
// }

global.clearTabs = () => {
  global.send(Channel.CLEAR_TABS)
}

let _md = global.md
global.md = (
  content = "",
  containerClasses = "p-5 prose prose-sm"
) => {
  return _md(content + "\n", containerClasses)
}

export let isAuthenticated = async () => {
  let envPath = kenvPath(".kenv")
  let envContents = await readFile(envPath, "utf8")
  // check if the .env file has a GITHUB_SCRIPTKIT_TOKEN
  return envContents.match(/^GITHUB_SCRIPTKIT_TOKEN=.*/g)
}

export let authenticate = async () => {
  let { Octokit } = await import(
    "../share/auth-scriptkit.js"
  )
  let octokit = new Octokit({
    auth: {
      scopes: ["gist"],
      env: "GITHUB_SCRIPTKIT_TOKEN",
    },
  })

  let user = await octokit.rest.users.getAuthenticated()

  let userJson = await getUserJson()
  await setUserJson({
    ...userJson,
    ...user.data,
  })

  return octokit
}

global.createGist = async (
  content: string,
  {
    fileName = "file.txt",
    description = "Gist Created in Script Kit",
    isPublic = false,
  } = {}
) => {
  let octokit = await authenticate()
  let response = await octokit.rest.gists.create({
    description,
    public: isPublic,
    files: {
      [fileName]: {
        content,
      },
    },
  })

  return response.data
}

global.browse = (url: string) => {
  return (global as any).open(url)
}

global.PROMPT = PROMPT

global.preload = (scriptPath?: string) => {
  if (process.send) {
    send(Channel.PRELOAD, scriptPath || global.kitScript)
  }
}

// global api for preloading main menu and removing listeners
let done = false
let executed = false
let beforeExit = () => {
  if (executed) return
  if (global?.trace?.flush) {
    global.trace.flush()
  }
  executed = true
  send(Channel.BEFORE_EXIT)
}

global.finishScript = () => {
  process.removeAllListeners("disconnect")
  if (typeof global.finishPrompt === "function") {
    global.finishPrompt()
  }

  let activeMessageListeners =
    process.listenerCount("message")

  beforeExit()
  if (!done && activeMessageListeners === 0) {
    // log(`🏁 Finish script`)
    done = true
    process.removeAllListeners()
  }
}
