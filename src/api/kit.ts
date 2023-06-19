import * as os from "os"
import { pathToFileURL } from "url"
import {
  QuickScore,
  quickScore,
  createConfig,
  Options,
  Config,
  ConfigOptions,
} from "quick-score"
import { formatDistanceToNow } from "@johnlindquist/kit-internal/date-fns"
import {
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
  defaultGroupClassName,
  defaultGroupNameClassName,
} from "../core/utils.js"
import {
  getScripts,
  getScriptFromString,
  getUserDb,
  getTimestamps,
  Stamp,
} from "../core/db.js"
import { Octokit } from "../share/auth-scriptkit.js"

import { stripAnsi } from "@johnlindquist/kit-internal/strip-ansi"

import { Kenv } from "../types/kit"

global.isWin = os.platform().startsWith("win")
global.isMac = os.platform().startsWith("darwin")
global.isLinux = os.platform().startsWith("linux")
global.cmd = global.isMac ? "cmd" : "ctrl"

export let errorPrompt = async (error: Error) => {
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

    if (secondLine?.match("at file://")) {
      errorFile = secondLine
        .replace("at file://", "")
        .replace(/:.*/, "")
        .trim()
      ;[, line, col] = secondLine
        .replace("at file://", "")
        .split(":")
    }

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

export let determineOutFile = scriptPath => {
  if (process.env.KIT_CONTEXT === "workflow") {
    // replace .ts with .mjs
    return scriptPath.replace(/\.ts$/, ".mjs")
  }

  let tmpScriptName = global.path
    .basename(scriptPath)
    .replace(/\.(ts|jsx|tsx)$/, ".mjs")

  let dirName = global.path.dirname(scriptPath)
  let inScriptsDir = dirName.endsWith(
    global.path.sep + "scripts"
  )
    ? ["..", ".scripts"]
    : []

  let outfile = global.path.join(
    scriptPath,
    "..",
    ...inScriptsDir,
    tmpScriptName
  )

  return outfile
}

export let buildTSScript = async (
  scriptPath,
  outPath = ""
) => {
  let external = []

  let localKenvNodeModulesPath = path.resolve(
    process.cwd(),
    "node_modules"
  )
  if (await isDir(localKenvNodeModulesPath)) {
    external = external.concat(
      await global.readdir(localKenvNodeModulesPath)
    )
  }

  let scriptsNodeModulesPath = path.resolve(
    process.cwd(),
    "scripts",
    "node_modules"
  )
  if (await isDir(scriptsNodeModulesPath)) {
    external = external.concat(
      await global.readdir(scriptsNodeModulesPath)
    )
  }

  let kitNodeModulesPath = kitPath("node_modules")
  if (await isDir(kitNodeModulesPath)) {
    external = external.concat(
      await global.readdir(kitNodeModulesPath)
    )
  }

  let mainKenvNodeModulesPath = home(
    ".kenv",
    "node_modules"
  )
  let subKenvNodeModulesPath = kenvPath("node_modules")
  if (await isDir(mainKenvNodeModulesPath)) {
    external = external.concat(
      await global.readdir(mainKenvNodeModulesPath)
    )
  }

  if (
    subKenvNodeModulesPath !== mainKenvNodeModulesPath &&
    (await isDir(subKenvNodeModulesPath))
  ) {
    external = external.concat(
      await global.readdir(subKenvNodeModulesPath)
    )
  }

  let contents = await readFile(scriptPath, "utf-8")
  // find all imports inside of the npm() function
  let imports = contents.match(
    /(?<=\s(npm|import)\(('|"))(.*)(?=('|")\))/g
  )

  if (Array.isArray(imports)) {
    external = external.concat(imports)
  }

  let outfile = outPath || determineOutFile(scriptPath)
  let { build } = await import("esbuild")

  let kenvTSConfig = kenvPath("tsconfig.json")
  let kitTSConfig = kitPath(
    "templates",
    "config",
    "tsconfig.json"
  )
  let hasKenvTSConfig = await isFile(kenvTSConfig)
  let tsconfig = hasKenvTSConfig
    ? kenvTSConfig
    : kitTSConfig
  await build({
    entryPoints: [scriptPath],
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    external,
    charset: "utf8",
    tsconfig,
  })
}

export let buildWidget = async (
  scriptPath,
  outPath = ""
) => {
  let outfile = outPath || determineOutFile(scriptPath)

  // let { build } = await import("esbuild")

  // await build({
  //   jsx: "transform",
  //   jsxFactory: "__renderToString",
  //   entryPoints: [scriptPath],
  //   outfile,
  //   bundle: true,
  //   platform: "node",
  //   format: "esm",
  //   external: [
  //     ...(await global.readdir(kenvPath("node_modules"))),
  //   ],
  //   tsconfig: kitPath(
  //     "templates",
  //     "config",
  //     "tsconfig.json"
  //   ),
  // })

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

global.attemptImport = async (scriptPath, ..._args) => {
  let importResult = undefined
  try {
    global.updateArgs(_args)

    if (scriptPath.match(/\.(ts|(t|j)sx)$/)) {
      try {
        let outfile = determineOutFile(scriptPath)
        if (process.env.KIT_CONTEXT !== "app") {
          await buildTSScript(scriptPath, outfile)
        }
        importResult = await import(
          pathToFileURL(outfile).href +
            "?uuid=" +
            global.uuid()
        )
      } catch (error) {
        await errorPrompt(error)
      }
    } else {
      importResult = await import(
        pathToFileURL(scriptPath).href +
          "?uuid=" +
          global.uuid()
      )
    }
  } catch (error) {
    let e = error.toString()
    if (
      e.startsWith("SyntaxError") &&
      e.match(
        /module|after argument list|await is only valid/
      )
    ) {
      let tmpScript = await copyTmpFile(
        scriptPath,
        global.path
          .basename(scriptPath)
          .replace(/\.js$/, ".mjs")
      )
      importResult = await import(
        tmpScript + "?uuid=" + global.uuid()
      )
      // await rm(mjsVersion)
    } else {
      if (process.env.KIT_CONTEXT === "app") {
        await errorPrompt(error)
      } else {
        global.warn(error)
      }
    }
  }

  return importResult
}

global.send = (channel: Channel, value?: any) => {
  if (process?.send) {
    try {
      process.send({
        pid: process.pid,
        kitScript: global.kitScript,
        channel,
        value,
      })
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

    _consoleLog(log)
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
}

global.show = async (html, options) => {
  await global.widget(
    md(`## Show is Deprecated

Please use the new \`widget\` function instead.

[https://github.com/johnlindquist/kit/discussions/745](https://github.com/johnlindquist/kit/discussions/745)`)
  )
  // global.send(Channel.SHOW, { options, html })
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
  await global.sendWait(Channel.SET_ENTER, text)
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

global.tmpPath = (...parts) => {
  let command = global?.kitScript
    ? resolveScriptToCommand(global.kitScript)
    : ""
  let scriptTmpDir = global.kenvPath(
    "tmp",
    command,
    ...parts
  )

  global.mkdir("-p", global.path.dirname(scriptTmpDir))
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

  if (typeof data === "object") {
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
global.onTab = (name, fn) => {
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
  if (!choices) return choices
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

    await global.sendWait(Channel.SET_SHORTCUTS, shortcuts)
  }
  global.kitPrevChoices = formattedChoices

  global.setLoading(false)
  return formattedChoices
}

global.setChoices = async (choices, className = "") => {
  let formattedChoices = await global.___kitFormatChoices(
    choices,
    className
  )
  return global.sendWait(
    Channel.SET_CHOICES,
    formattedChoices
  )
}

global.flag ||= {}
global.prepFlags = (flags: FlagsOptions): FlagsOptions => {
  for (let key of Object.keys(global?.flag)) {
    delete global?.flag?.[key]
  }

  if (!flags || Object.entries(flags)?.length === 0)
    return false

  let validFlags = {
    sortChoicesKey:
      (flags as FlagsWithKeys)?.sortChoicesKey || [],
    order: (flags as FlagsWithKeys)?.order || [],
  }
  let currentFlags = Object.entries(flags)
  for (let [key, value] of currentFlags) {
    if (key === "order") continue
    if (key === "sortChoicesKey") continue
    validFlags[key] = {
      name: value?.name || key,
      group: value?.group || "",
      shortcut: value?.shortcut || "",
      description: value?.description || "",
      value: key,
      bar: value?.bar || "",
      preview: value?.preview || "",
    }
  }

  global.kitFlagsAsChoices = currentFlags.map(
    ([key, value]) => {
      return {
        id: key,
        group: value?.group || "",
        name: value?.name || key,
        value: key,
        description: value?.description || "",
        preview: value?.preview || `<div></div>`,
      }
    }
  )

  return validFlags
}

global.setFlags = (flags: FlagsOptions) => {
  global.send(Channel.SET_FLAGS, global.prepFlags(flags))
}

global.hide = async () => {
  await global.sendWait(Channel.HIDE_APP, {})
  if (process.env.KIT_HIDE_DELAY) {
    await wait(-process.env.KIT_HIDE_DELAY)
  }
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

  let { default: highlight } = await import("highlight.js")
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
  let groupedApps = choices.map(c => {
    c.group = "Apps"
    return c
  })

  groupedApps.unshift({
    name: "Apps",
    group: "Apps",
    className: defaultGroupClassName,
    nameClassName: defaultGroupNameClassName,
    height: PROMPT.ITEM.HEIGHT.XXS,
    skip: true,
  })

  return groupedApps
}

let groupScripts = scripts => {
  return groupChoices(scripts, {
    groupKey: "kenv",
    missingGroupName: "Main",
    order: ["Favorite", "Main"],
    recentKey: "timestamp",
    recentLimit: process?.env?.KIT_RECENT_LIMIT
      ? parseInt(process.env.KIT_RECENT_LIMIT, 10)
      : 3,
  })
}

export let mainMenu = async (
  message: string | PromptConfig = "Select a script",
  fromCache = true,
  xf = (x: Script[]) => x,
  ignoreKenvPattern = /^ignore$/
): Promise<Script | string> => {
  let scripts: Script[] = xf(
    await getScripts(fromCache, ignoreKenvPattern)
  )
  let timestampsDb = await getTimestamps(fromCache)
  scripts = await Promise.all(
    scripts.map(processScript(timestampsDb.stamps))
  )

  let groupedScripts = groupScripts(scripts)

  let apps = await getApps()
  if (apps.length) {
    groupedScripts = groupedScripts.concat(apps)
  }

  let scriptsConfig = buildScriptConfig(message)
  scriptsConfig.keepPreview = true

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

export let processScript =
  (timestamps: Stamp[]) =>
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

    let previewPath = getPreviewPath(s)

    if (await isFile(previewPath)) {
      await processWithPreviewFile(
        s,
        previewPath,
        infoBlock
      )
    } else if (typeof s?.preview === "string") {
      await processWithStringPreview(s, infoBlock)
    } else {
      s.preview = await processWithNoPreview(s, infoBlock)
    }

    return s
  }

export let getPreviewPath = (s: Script): string => {
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
) => {
  try {
    let preview = await readFile(previewPath, "utf8")
    let content = await highlightJavaScript(
      s.filePath,
      s.shebang
    )
    s.preview = md(infoBlock + preview) + content
  } catch (error) {
    s.preview = md(
      `Could not find doc file ${previewPath} for ${s.name}`
    )
    warn(
      `Could not find doc file ${previewPath} for ${s.name}`
    )
  }
}

export let processWithStringPreview = async (
  s: Script,
  infoBlock: string
) => {
  if (s?.preview === "false") {
    s.preview = `<div/>`
  } else {
    try {
      let content = await readFile(
        path.resolve(
          path.dirname(s.filePath),
          s?.preview as string
        ),
        "utf-8"
      )
      s.preview = infoBlock
        ? md(infoBlock)
        : `` + (await highlight(content))
    } catch (error) {
      s.preview = `Error: ${error.message}`
    }
  }
}

export let processWithNoPreview = async (
  s: Script,
  infoBlock: string
) => {
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

  let content = await highlightJavaScript(
    preview,
    s?.shebang || ""
  )
  return infoBlock ? md(infoBlock) : `` + content
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
  let { default: hljs } = await import("highlight.js")

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
      const language = hljs.getLanguage(lang)
        ? lang
        : "plaintext"
      return hljs.highlight(code, { language }).value
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

export let authenticate = async () => {
  let octokit = new Octokit({
    auth: {
      scopes: ["gist"],
      env: "GITHUB_SCRIPTKIT_TOKEN",
    },
  })

  let user = await octokit.rest.users.getAuthenticated()

  let userDb = await getUserDb()
  Object.assign(userDb, user.data)
  await userDb.write()

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
