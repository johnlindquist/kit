//cjs is required to load/assign the content of this script synchronously
//we may be able to convert this to .js if an "--import" flag is added
//https://github.com/nodejs/node/issues/35103

global.attemptImport = async (path, ..._args) => {
  global.updateArgs(_args)
  try {
    //import caches loaded scripts, so we cache-bust with a uuid in case we want to load a script twice
    //must use `import` for ESM
    return await import(path + `?uuid=${global.uuid()}`)
  } catch (error) {
    console.warn(error.message)
    global.setPlaceholder(error.message)

    await global.wait(1000)
    try {
      let stackWithoutId = error.stack.replace(
        /\?[^:]*/,
        ""
      )
      console.warn(stackWithoutId)
      let errorFile = stackWithoutId
        .split("\n")[1]
        .replace("at file://", "")
        .replace(/:.*/, "")
        .trim()

      let [, line, col] = stackWithoutId
        .split("\n")[1]
        .replace("at file://", "")
        .split(":")
      console.log({ line, col })
      if (errorFile.includes(global.kenvPath())) {
        global.edit(errorFile, global.kenvPath(), line, col)
      }
    } catch {}

    await global.wait(2000)
    exit(1)
  }
}

global.runSub = async (scriptPath, ...runArgs) => {
  return new Promise(async (res, rej) => {
    let values = []
    if (!scriptPath.includes("/")) {
      scriptPath = global.kenvPath("scripts", scriptPath)
    }
    if (!scriptPath.startsWith(global.path.sep)) {
      scriptPath = global.kenvPath(scriptPath)
    }

    if (!scriptPath.endsWith(".js"))
      scriptPath = scriptPath + ".js"

    // console.log({ scriptPath, args, argOpts, runArgs })
    let scriptArgs = [
      ...global.args,
      ...runArgs,
      ...global.argOpts,
    ].filter(arg => {
      if (typeof arg === "string") return arg.length > 0

      return arg
    })
    let child = fork(scriptPath, scriptArgs, {
      stdio: "inherit",
      execArgv: [
        "--require",
        "dotenv/config",
        "--require",
        global.kitPath("preload/api.js"),
        "--require",
        global.kitPath("preload/kit.js"),
        "--require",
        global.kitPath("preload/mac.js"),
      ],
      //Manually set node. Shouldn't have to worry about PATH
      execPath: global.env.KIT_NODE,
      env: {
        ...global.env,
        KIT_PARENT_NAME:
          global.env.KIT_PARENT_NAME ||
          global.env.KIT_SCRIPT_NAME,
        KIT_ARGS:
          global.env.KIT_ARGS || scriptArgs.join("."),
      },
    })

    let name = process.argv[1].replace(
      global.kenvPath() + global.path.sep,
      ""
    )
    let childName = scriptPath.replace(
      global.kenvPath() + global.path.sep,
      ""
    )

    console.log(childName, child.pid)

    let forwardToChild = message => {
      console.log(name, "->", childName)
      child.send(message)
    }
    process.on("message", forwardToChild)

    child.on("message", (message: any) => {
      console.log(name, "<-", childName)
      global.send(message)
      values.push(message)
    })

    child.on("error", error => {
      console.warn(error)
      values.push(error)
      rej(values)
    })

    child.on("close", code => {
      process.off("message", forwardToChild)
      res(values)
    })
  })
}

process.on("uncaughtException", async err => {
  console.warn(`UNCAUGHT EXCEPTION: ${err}`)
  exit()
})

global.send = async (channel, data) => {
  if (process?.send) {
    process.send({
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
  console.log = async (...args) => {
    global.send("CONSOLE_LOG", {
      log: args
        .map(a =>
          typeof a != "string" ? JSON.stringify(a) : a
        )
        .join(" "),
    })
  }

  console.warn = async (...args) => {
    global.send("CONSOLE_WARN", {
      warn: args
        .map(a =>
          typeof a != "string" ? JSON.stringify(a) : a
        )
        .join(" "),
    })
  }
}

global.show = (html, options) => {
  global.send("SHOW", { options, html })
}

global.showImage = (image, options) => {
  global.send("SHOW_IMAGE", {
    options,
    image:
      typeof image === "string" ? { src: image } : image,
  })
}

global.setPlaceholder = text => {
  global.send("SET_PLACEHOLDER", {
    text,
  })
}

global.run = async (name, ..._args) => {
  global.onTabs = []
  global.kitScript = name
  global.send("RUN_SCRIPT", {
    name,
    args: _args,
  })
  // setPlaceholder(`>_ ${kitScript}...`)
  let kitScriptPath =
    global.kenvPath("scripts", global.kitScript) + ".js"

  return global.attemptImport(kitScriptPath, ..._args)
}

global.kit = async (scriptPath, ..._args) => {
  let kitScriptPath =
    global.kitPath("lib", scriptPath) + ".js"
  return await global.attemptImport(kitScriptPath, ..._args)
}

global.main = async (scriptPath, ..._args) => {
  let kitScriptPath =
    global.kitPath("main", scriptPath) + ".js"
  return await global.attemptImport(kitScriptPath, ..._args)
}

global.lib = async (scriptPath, ..._args) => {
  let kitScriptPath = global.libPath(scriptPath) + ".js"
  return await global.attemptImport(kitScriptPath, ..._args)
}

global.cli = async (cliPath, ..._args) => {
  let cliScriptPath =
    global.kitPath("cli/" + cliPath) + ".js"
  return await global.attemptImport(cliScriptPath, ..._args)
}

global.setup = async (setupPath, ..._args) => {
  global.setPlaceholder(`>_ setup: ${setupPath}...`)
  let setupScriptPath =
    global.kitPath("setup/" + setupPath) + ".js"
  return await global.attemptImport(
    setupScriptPath,
    ..._args
  )
}

global.kitLib = async lib => {
  return await global.kit(`kit/${lib}`)
}

global.tmp = file => {
  let scriptTmpDir = global.kenvPath(
    "tmp",
    global.kitScript
  )
  mkdir("-p", scriptTmpDir)
  return global.kenvPath("tmp", global.kitScript, file)
}
global.inspect = async (data, extension) => {
  let dashedDate = () =>
    new Date()
      .toISOString()
      .replace("T", "-")
      .replace(/:/g, "-")
      .split(".")[0]

  let tmpFilePath = global.kenvPath("tmp", global.kitScript)
  let formattedData = data
  let tmpFullPath = global.path.join(
    tmpFilePath,
    `${dashedDate()}.txt`
  )
  if (typeof data === "object") {
    formattedData = JSON.stringify(data, null, "\t")
    tmpFullPath = global.path.join(
      tmpFilePath,
      `${dashedDate()}.json`
    )
  }

  if (extension) {
    tmpFullPath = global.path.join(
      tmpFilePath,
      `${dashedDate()}.${extension}`
    )
  }

  mkdir("-p", tmpFilePath)
  await writeFile(tmpFullPath, formattedData)

  await global.edit(tmpFullPath)
}

global.compileTemplate = async (template, vars) => {
  let templateContent = await readFile(
    global.kenvPath("templates", template),
    "utf8"
  )
  let templateCompiler = compile(templateContent)
  return templateCompiler(vars)
}

global.currentOnTab = null
global.onTabs = []
global.onTab = async (name, fn) => {
  global.onTabs.push({ name, fn })
  if (global.arg.tab) {
    if (global.arg.tab === name) {
      global.send("SET_TAB_INDEX", {
        tabIndex: global.onTabs.length - 1,
      })
      global.currentOnTab = await fn()
    }
  } else if (global.onTabs.length === 1) {
    global.send("SET_TAB_INDEX", { tabIndex: 0 })
    global.currentOnTab = await fn()
  }
}

global.kitPrevChoices = []
global.setChoices = async choices => {
  if (typeof choices === "object") {
    choices = choices.map(choice => {
      if (typeof choice === "string") {
        return {
          name: choice,
          value: choice,
          id: global.uuid(),
        }
      }

      if (typeof choice === "object") {
        if (!choice?.id) {
          choice.id = global.uuid()
        }
      }

      return choice
    })
  }

  if (
    typeof choices === "object" &&
    Array.isArray(choices) &&
    choices?.length &&
    (choices as Choice<any>[])?.every(
      (c, i) =>
        c.name == global.kitPrevChoices?.[i]?.name &&
        c.value == global.kitPrevChoices?.[i]?.value
    )
  ) {
    return
  }

  global.send("SET_CHOICES", { choices })
  global.kitPrevChoices = choices
}

global.md = markdown => require("marked")(markdown)
