import * as os from "os"
import { pathToFileURL } from "url"

import {
  AppState,
  Choice,
  FlagsOptions,
  PromptConfig,
  Script,
} from "../types/core"
import { Channel } from "../core/enum.js"

import {
  kitPath,
  kenvPath,
  resolveScriptToCommand,
  run,
  getKenvs,
} from "../core/utils.js"
import {
  getScripts,
  getScriptFromString,
  getUserDb,
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
    console.log(error)
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
    /(?<=\snpm\(('|"))(.*)(?=('|")\))/g
  )

  if (Array.isArray(imports)) {
    external = external.concat(imports)
  }

  let outfile = outPath || determineOutFile(scriptPath)
  let { build } = await import("esbuild")
  await build({
    entryPoints: [scriptPath],
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    external,
    charset: "utf8",
    tsconfig: kitPath(
      "templates",
      "config",
      "tsconfig.json"
    ),
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

// process.on("uncaughtException", async err => {
//   await errorPrompt(err)
// })

// process.on("rejectionHandled", async code => {
//   console.log({ code })
// })

// process.on("warning", async warning => {
//   console.log({ warning })
// })

global.send = async (channel: Channel, value?: any) => {
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

let _consoleLog = console.log.bind(console)
let _consoleWarn = console.warn.bind(console)
let _consoleClear = console.clear.bind(console)
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
  console.log = (...args) => {
    let log = args
      .map(a =>
        typeof a != "string" ? JSON.stringify(a) : a
      )
      .join(" ")

    _consoleLog(log)
    global.send(Channel.CONSOLE_LOG, log)
  }

  console.warn = (...args) => {
    let warn = args
      .map(a =>
        typeof a != "string" ? JSON.stringify(a) : a
      )
      .join(" ")

    global.send(Channel.CONSOLE_WARN, warn)
  }

  console.clear = () => {
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

global.setEnter = text => {
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

global.setChoices = async (choices, className = "") => {
  if (typeof choices === "object") {
    if (choices !== null) {
      choices = (choices as Choice<any>[]).map(choice => {
        if (typeof choice === "string") {
          return {
            name: choice,
            value: choice,
            className,
            id: global.uuid(),
          }
        }

        if (typeof choice === "object") {
          if (Boolean(choice?.preview))
            choice.hasPreview = true

          if (!choice?.id) {
            choice.id = global.uuid()
          }
          if (typeof choice?.name === "undefined") {
            choice.name = ""
          }
          if (typeof choice.value === "undefined") {
            return {
              className,
              ...choice,
              value: choice,
            }
          }
        }

        return choice
      })
    }
  }

  if (
    global?.__currentPromptConfig?.shortcuts &&
    choices?.[0]
  ) {
    const shortcuts =
      global?.__currentPromptConfig?.shortcuts?.filter(
        shortcut => {
          if (shortcut?.condition) {
            return shortcut.condition(choices?.[0])
          }
          return true
        }
      )

    if (setShortcuts) setShortcuts(shortcuts)
  }

  let p = global.sendWait(Channel.SET_CHOICES, choices)
  global.kitPrevChoices = choices

  global.setLoading(false)

  return p
}

global.flag = {}
global.prepFlags = (flags: FlagsOptions): FlagsOptions => {
  for (let key of Object.keys(global?.flag)) {
    delete global?.flag?.[key]
  }

  if (!flags || Object.entries(flags)?.length === 0)
    return false

  let validFlags = {}
  for (let [key, value] of Object.entries(flags)) {
    validFlags[key] = {
      name: value?.name || key,
      shortcut: value?.shortcut || "",
      description: value?.description || "",
      value: key,
      bar: value?.bar || "",
    }
  }

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

export let highlightJavaScript = async (
  filePath: string
): Promise<string> => {
  let isPathAFile = await isFile(filePath)
  let contents = ``
  if (isPathAFile) {
    contents = await readFile(filePath, "utf8")
  } else {
    contents = filePath.trim()
  }

  let { default: highlight } = await import("highlight.js")
  let highlightedContents = highlight.highlight(contents, {
    language: "javascript",
  }).value

  let wrapped = wrapCode(highlightedContents, "px-5")
  return wrapped
}

export let selectScript = async (
  message: string | PromptConfig = "Select a script",
  fromCache = true,
  xf = (x: Script[]) => x
): Promise<Script> => {
  let scripts: Script[] = xf(await getScripts(fromCache))
  scripts = await Promise.all(
    scripts.map(async s => {
      if (typeof s?.preview === "string") {
        if (s?.preview === "false") {
          s.preview = `<div/>`
          return s
        }
        if (s?.preview === "docs") {
          let previewPath = path.resolve(
            path.dirname(path.dirname(s.filePath)),
            "docs",
            path.parse(s.filePath).name + ".md"
          )
          try {
            let preview = await readFile(
              previewPath,
              "utf8"
            )
            let content = await highlightJavaScript(
              s.filePath
            )
            s.preview = md(preview) + content
          } catch (error) {
            s.preview = md(
              `Could not find doc file ${previewPath} for ${s.name}`
            )
            warn(
              `Could not find doc file ${previewPath} for ${s.name}`
            )
          }
        } else {
          try {
            let content = await readFile(
              path.resolve(
                path.dirname(s.filePath),
                s?.preview
              ),
              "utf-8"
            )
            s.preview = await highlight(content)
          } catch (error) {
            s.preview = `Error: ${error.message}`
          }
        }
      } else {
        s.preview = async () => {
          let preview = await readFile(s.filePath, "utf8")
          if (
            preview.startsWith("/*") &&
            preview.includes("*/")
          ) {
            let index = preview.indexOf("*/")
            let content = preview.slice(2, index).trim()
            let markdown = md(content)
            let js = await highlightJavaScript(
              preview.slice(index + 2).trim()
            )
            return markdown + js
          }
          return highlightJavaScript(preview)
        }
      }

      return s
    })
  )
  let scriptsConfig =
    typeof message === "string"
      ? {
          placeholder: message,
        }
      : message
  scriptsConfig.scripts = true
  scriptsConfig.resize = false
  scriptsConfig.enter ||= "Select"
  let script = await global.arg(scriptsConfig, scripts)
  if (
    typeof script === "string" &&
    (typeof message === "string" ||
      message?.strict === true)
  ) {
    return await getScriptFromString(script)
  } else {
    return script //hmm...
  }
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

global.term = async commandOrConfig => {
  let defaultConfig = {
    shell: true,
  }
  let command =
    (typeof commandOrConfig === "string"
      ? commandOrConfig
      : commandOrConfig?.command) || ""
  let task = global.exec(command, {
    ...defaultConfig,
    ...(typeof commandOrConfig === "object"
      ? commandOrConfig
      : {}),
  })
  task.stdout.pipe(process.stdout)
  task.stderr.pipe(process.stderr)
  let result = await task
  return result?.stdout || result?.stderr || ""
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

global.projectPath = (...args) => {
  throw new Error(
    `Script not loaded. Can't use projectPath() until a script is imported`
  )
}

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
