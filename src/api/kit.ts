import {
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
  getLastSlashSeparated,
} from "../core/utils.js"
import {
  getScripts,
  getScriptFromString,
  getAppDb,
} from "../core/db.js"
import { stripAnsi } from "@johnlindquist/kit-internal/strip-ansi"
import { Kenv } from "../types/kit"

export let errorPrompt = async (error: Error) => {
  if (process.env.KIT_CONTEXT === "app") {
    console.warn(`☠️ ERROR PROMPT SHOULD SHOW ☠️`)
    let stackWithoutId = error.stack.replace(/\?[^:]*/g, "")
    console.warn(stackWithoutId)
    // console.warn(stackWithoutId)

    let errorFile = global.kitScript
    let line: string = "1"
    let col: string = "1"

    let secondLine = stackWithoutId.split("\n")[1] || ""

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
    // .replaceAll('"', '\\"')
    // .replaceAll(/(?:\r\n|\r|\n)/gm, "$newline$")

    let child = global.spawnSync(kitPath("bin", "sk"), [
      kitPath("cli", "error-action.js"),
      script,
      errorJsonPath, //.replaceAll('"', '\\"'),
      errorFile,
      line,
      col,
    ])
  } else {
    console.log(error)
  }
}

export const outputTmpFile = async (
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

export const copyTmpFile = async (
  fromFile: string,
  fileName: string
) =>
  await outputTmpFile(
    fileName,
    await global.readFile(fromFile, "utf-8")
  )

global.attemptImport = async (scriptPath, ..._args) => {
  let importResult = undefined
  try {
    global.updateArgs(_args)

    if (scriptPath.endsWith(".ts")) {
      try {
        let { build } = await import("esbuild")

        let tmpScriptName = global.path
          .basename(scriptPath)
          .replace(/\.ts$/, ".mjs")

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

        await build({
          entryPoints: [scriptPath],
          outfile,
          bundle: true,
          platform: "node",
          format: "esm",
          external: [
            ...(await global.readdir(
              kenvPath("node_modules")
            )),
          ],
          tsconfig: kitPath(
            "templates",
            "config",
            "tsconfig.json"
          ),
        })

        importResult = await import(
          outfile + "?uuid=" + global.uuid()
        )
      } catch (error) {
        await errorPrompt(error)
      }
    } else {
      //import caches loaded scripts, so we cache-bust with a uuid in case we want to load a script twice
      //must use `import` for ESM
      importResult = await import(
        scriptPath + "?uuid=" + global.uuid()
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
      importResult = await run(tmpScript)
      // await rm(mjsVersion)
    } else {
      if (process.env.KIT_CONTEXT === "app") {
        await errorPrompt(error)
      } else {
        console.warn(error)
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

global.send = async (channel, data) => {
  if (process?.send) {
    process.send({
      pid: process.pid,
      kitScript: global.kitScript,
      channel,
      ...data,
    })
  } else {
    // console.log(from, ...args)
  }
}

if (process?.send) {
  let _consoleLog = console.log.bind(console)
  let _consoleWarn = console.warn.bind(console)
  let _consoleClear = console.clear.bind(console)
  console.log = (...args) => {
    let log = args
      .map(a =>
        typeof a != "string" ? JSON.stringify(a) : a
      )
      .join(" ")

    global.send(Channel.CONSOLE_LOG, {
      log,
    })
  }

  console.warn = (...args) => {
    let warn = args
      .map(a =>
        typeof a != "string" ? JSON.stringify(a) : a
      )
      .join(" ")

    global.send(Channel.CONSOLE_WARN, {
      warn,
    })
  }

  console.clear = () => {
    global.send(Channel.CONSOLE_CLEAR, {})
  }
}

global.show = (html, options) => {
  global.send(Channel.SHOW, { options, html })
}

global.devTools = data => {
  global.send(Channel.DEV_TOOLS, { data })
}

global.showImage = (image, options) => {
  global.send(Channel.SHOW_IMAGE, {
    options,
    image:
      typeof image === "string" ? { src: image } : image,
  })
}

global.setPlaceholder = text => {
  global.send(Channel.SET_PLACEHOLDER, {
    text: stripAnsi(text),
  })
}

global.main = async (scriptPath: string, ..._args) => {
  let kitScriptPath = kitPath("main", scriptPath) + ".js"
  return await global.attemptImport(kitScriptPath, ..._args)
}

global.lib = async (lib: string, ..._args) => {
  let libScriptPath = kenvPath("lib", lib) + ".js"
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
global.inspect = async (data, extension) => {
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

  if (extension) {
    tmpFullPath = global.tmpPath(
      `${dashedDate()}.${extension}`
    )
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
      global.send(Channel.SET_TAB_INDEX, {
        tabIndex,
      })
      global.currentOnTab = fn()
    }
  } else if (global.onTabs.length === 1) {
    global.onTabIndex = 0
    global.send(Channel.SET_TAB_INDEX, { tabIndex: 0 })
    global.currentOnTab = fn()
  }
}

global.kitPrevChoices = []
global.setChoices = async (choices, className = "") => {
  if (typeof choices === "object") {
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
        choice.hasPreview = Boolean(choice?.preview)

        if (!choice?.id) {
          choice.id = global.uuid()
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

  global.send(Channel.SET_CHOICES, {
    choices,
    scripts: true,
  })
  global.kitPrevChoices = choices
}

global.flag = {}
global.setFlags = (flags: FlagsOptions) => {
  let validFlags = {}
  for (let [key, value] of Object.entries(flags)) {
    validFlags[key] = {
      name: value?.name || key,
      shortcut: value?.shortcut || "",
      description: value?.description || "",
      value: key,
    }
  }
  global.send(Channel.SET_FLAGS, { flags: validFlags })
}
global.hide = () => {
  global.send(Channel.HIDE_APP)
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
        font-size: 0.75rem !important;
        width: 100%;
        white-space: pre-wrap;
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
  let contents = await readFile(filePath, "utf-8")

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

  scripts = scripts.map(s => {
    s.preview = async () => {
      return highlightJavaScript(s.filePath)
    }
    return s
  })

  let script: Script | string = await global.arg(
    message,
    scripts
  )

  if (typeof script === "string") {
    return await getScriptFromString(script)
  }

  return script
}

global.selectScript = selectScript

export let selectKenv = async (
  ignorePattern = /^ignore$/
) => {
  let homeKenv = {
    name: "home",
    description: `Your main kenv: ${kenvPath()}`,
    value: {
      name: "home",
      dirPath: kenvPath(),
    },
  }
  let selectedKenv: Kenv | string = homeKenv.value

  let kenvs = await getKenvs(ignorePattern)
  if (kenvs.length) {
    let kenvChoices = [
      homeKenv,
      ...kenvs.map(p => {
        let name = getLastSlashSeparated(p, 1)
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

    selectedKenv = await global.arg(
      `Select target kenv`,
      kenvChoices
    )

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

  global.marked.setOptions({
    renderer: new global.marked.Renderer(),
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
  global.send(Channel.SET_TAB_INDEX, { tabIndex: i })
  global.onTabs[i].fn()
}
