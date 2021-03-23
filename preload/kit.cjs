//cjs is required to load/assign the content of this script synchronously
//we may be able to convert this to .js if an "--import" flag is added
//https://github.com/nodejs/node/issues/35103

let context = require(`./${
  process.env?.KIT_CONTEXT === "app" ? "app" : "tty"
}.cjs`)

let attemptImport = async (path, _args) => {
  updateArgs(_args)
  try {
    //import caches loaded scripts, so we cache-bust with a uuid in case we want to load a script twice
    //must use `import` for ESM
    return await import(path + `?uuid=${uuid()}`)
  } catch (error) {
    console.warn(error.message)
    send("UPDATE_PROMPT_WARN", {
      info: error.message,
    })

    await wait(1000)
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
      if (errorFile.includes(kenvPath())) {
        edit(errorFile, kenvPath(), line, col)
      }
    } catch {}

    await wait(2000)
    exit(1)
  }
}

runSub = async (scriptPath, ...runArgs) => {
  return new Promise(async (res, rej) => {
    let values = []
    if (!scriptPath.includes("/")) {
      scriptPath = kenvPath("scripts", scriptPath)
    }
    if (!scriptPath.startsWith(path.sep)) {
      scriptPath = kenvPath(scriptPath)
    }

    if (!scriptPath.endsWith(".js"))
      scriptPath = scriptPath + ".js"

    // console.log({ scriptPath, args, argOpts, runArgs })
    let scriptArgs = [
      ...args,
      ...runArgs,
      ...argOpts,
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
        kitPath("preload/api.cjs"),
        "--require",
        kitPath("preload/kit.cjs"),
        "--require",
        kitPath("preload/mac.cjs"),
      ],
      //Manually set node. Shouldn't have to worry about PATH
      execPath: env.KIT_NODE,
      env: {
        ...env,
        KIT_PARENT_NAME:
          env.KIT_PARENT_NAME || env.KIT_SCRIPT_NAME,
        KIT_ARGS: env.KIT_ARGS || scriptArgs.join("."),
      },
    })

    let name = process.argv[1].replace(
      kenvPath() + path.sep,
      ""
    )
    let childName = scriptPath.replace(
      kenvPath() + path.sep,
      ""
    )

    console.log(childName, child.pid)

    let forwardToChild = message => {
      console.log(name, "->", childName)
      child.send(message)
    }
    process.on("message", forwardToChild)

    child.on("message", message => {
      console.log(name, "<-", childName)
      send(message)
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

// TODO: Strip out minimist
args = []

updateArgs = arrayOfArgs => {
  let argv = require("minimist")(arrayOfArgs)
  args = [...args, ...argv._]
  argOpts = Object.entries(argv)
    .filter(([key]) => key != "_")
    .flatMap(([key, value]) => {
      if (typeof value === "boolean") {
        if (value) return [`--${key}`]
        if (!value) return [`--no-${key}`]
      }
      return [`--${key}`, value]
    })

  assignPropsTo(argv, arg)
}

updateArgs(process.argv.slice(2))

env = async (envKey, promptConfig = {}) => {
  if (env[envKey]) return env[envKey]

  let input = await prompt({
    message: `Set ${envKey} env to:`,
    ...promptConfig,
    cache: false,
  })

  if (input.startsWith("~"))
    input = input.replace("~", env.HOME)

  await cli("set-env-var", envKey, input)
  env[envKey] = input
  return input
}

assignPropsTo(process.env, env)

env.KIT_BIN_FILE_PATH = process.argv[1]
env.KIT_SRC_NAME = process.argv[1]
  .split(env.KENV.split(path.sep).pop())
  .pop()

env.KIT_SCRIPT_NAME = env.KIT_SRC_NAME.replace(".js", "")

kitPath = (...parts) => path.join(env.KIT, ...parts)

kenvPath = (...parts) => {
  return path.join(env.KENV, ...parts.filter(Boolean))
}

libPath = (...parts) => path.join(kenvPath("lib"), ...parts)

kitScriptFromPath = path => {
  path = path.replace(kenvPath() + "/", "")
  path = path.replace(/\.js$/, "")
  return path
}

kitFromPath = path => {
  path = path.replace(env.KIT + "/", "")
  path = path.replace(/\.js$/, "")
  return path
}

kitScript = kitScriptFromPath(env.KIT_SCRIPT_NAME)

setPromptText = text => {
  send("SET_PROMPT_TEXT", {
    text,
  })
}

run = async (name, ..._args) => {
  onTabs = []
  kitScript = name
  send("RUN_SCRIPT", {
    name,
    arg: _args,
  })
  // setPromptText(`>_ ${kitScript}...`)
  let kitScriptPath = kenvPath("scripts", kitScript) + ".js"

  return attemptImport(kitScriptPath, _args)
}

kit = async (scriptPath, ..._args) => {
  let kitScriptPath = kitPath("kit", scriptPath) + ".js"
  return await attemptImport(kitScriptPath, _args)
}

lib = async (scriptPath, ..._args) => {
  let kitScriptPath = libPath(scriptPath) + ".js"
  return await attemptImport(kitScriptPath, _args)
}

cli = async (cliPath, ..._args) => {
  let cliScriptPath = kitPath("cli/" + cliPath) + ".js"
  return await attemptImport(cliScriptPath, _args)
}

setup = async (setupPath, ..._args) => {
  setPromptText(`>_ setup: ${setupPath}...`)
  let setupScriptPath =
    kitPath("setup/" + setupPath) + ".js"
  return await attemptImport(setupScriptPath, _args)
}

kitLib = async lib => {
  return await kit(`kit/${lib}`)
}

tmp = file => {
  let scriptTmpDir = kenvPath("tmp", kitScript)
  mkdir("-p", scriptTmpDir)
  return kenvPath("tmp", kitScript, file)
}
inspect = async (data, extension) => {
  let dashedDate = () =>
    new Date()
      .toISOString()
      .replace("T", "-")
      .replaceAll(":", "-")
      .split(".")[0]

  let tmpFilePath = kenvPath("tmp", kitScript)
  let formattedData = data
  let tmpFullPath = path.join(
    tmpFilePath,
    `${dashedDate()}.txt`
  )
  if (typeof data === "object") {
    formattedData = JSON.stringify(data, null, "\t")
    tmpFullPath = path.join(
      tmpFilePath,
      `${dashedDate()}.json`
    )
  }

  if (extension) {
    tmpFullPath = path.join(
      tmpFilePath,
      `${dashedDate()}.${extension}`
    )
  }

  mkdir("-p", tmpFilePath)
  await writeFile(tmpFullPath, formattedData)

  await edit(tmpFullPath)
}

compileTemplate = async (template, vars) => {
  let templateContent = await readFile(
    kenvPath("templates", template),
    "utf8"
  )
  let templateCompiler = compile(templateContent)
  return templateCompiler(vars)
}

currentOnTab = null
onTabs = []
onTab = async (name, fn) => {
  onTabs.push({ name, fn })
  if (arg.tab) {
    if (arg.tab === name) {
      send("SET_TAB_INDEX", { tabIndex: onTabs.length - 1 })
      currentOnTab = await fn()
    }
  } else if (onTabs.length === 1) {
    send("SET_TAB_INDEX", { tabIndex: 0 })
    currentOnTab = await fn()
  }
}
