import { Choice, FlagsOptions } from "../types/core"
import { Channel } from "../core/enum.js"

import {
  kitPath,
  kenvPath,
  resolveScriptToCommand,
  copyTmpFile,
  run,
} from "../core/utils.js"
import { stripAnsi } from "@johnlindquist/kit-internal/strip-ansi"

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

export {}
