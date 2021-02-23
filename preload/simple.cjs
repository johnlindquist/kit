//cjs is required to load/assign the content of this script synchronously
//we may be able to convert this to .js if an "--import" flag is added
//https://github.com/nodejs/node/issues/35103

let context = require(`./${
  process.env?.SIMPLE_CONTEXT === "app" ? "app" : "tty"
}.cjs`)

install = async packageNames => {
  return await new Promise((res, rej) => {
    let npm = spawn("npm", ["i", ...packageNames], {
      stdio: "inherit",
      cwd: env.SIMPLE_PATH,
      env: {
        //need to prioritize our node over any nodes on the path
        PATH: sdkPath("node", "bin") + ":" + env.PATH,
      },
    })

    npm.on("error", error => {
      console.log({ error })
      rej(error)
    })

    npm.on("exit", exit => {
      console.log({ exit })
      res(exit)
    })
  })
}

simple = async lib => {
  try {
    return await sdk(`simple/${lib}`)
  } catch (error) {
    console.log(error)
    console.log(`Simple ${lib} doesn't exist`)
    exit()
  }
}

script = async (scriptPath, ..._args) => {
  simpleScript = simpleScriptFromPath(scriptPath)
  args.push(..._args)
  let simpleScriptPath =
    simplePath("scripts", scriptPath) + ".js"

  //import caches loaded scripts, so we cache-bust with a uuid in case we want to load a script twice
  try {
    return await import(simpleScriptPath + `?uuid=${v4()}`)
  } catch (error) {
    let errorMessage = `Error importing: ${simpleScriptPath
      .split("/")
      .pop()}. Opening...`
    console.warn(errorMessage)
    if (process?.send) {
      process.send({
        from: "UPDATE_PROMPT_INFO",
        info: errorMessage,
      })
    }

    await wait(2000)
  }
}

sdk = async (scriptPath, ..._args) => {
  args.push(..._args)

  let sdkScriptPath = sdkPath(scriptPath) + ".js"
  //import caches loaded scripts, so we cache-bust with a uuid in case we want to load a script twice
  try {
    return await import(sdkScriptPath + `?uuid=${v4()}`)
  } catch (error) {
    let errorMessage = `Error importing: ${sdkScriptPath
      .split("/")
      .pop()}. Opening...`
    console.warn(errorMessage)
    if (process?.send) {
      process.send({
        from: "UPDATE_PROMPT_INFO",
        info: errorMessage,
      })
    }

    await wait(2000)
  }
}

run = async (scriptPath, ...runArgs) => {
  return new Promise(async (res, rej) => {
    let values = []
    if (!scriptPath.includes("/")) {
      scriptPath = simplePath("scripts", scriptPath)
    }
    if (!scriptPath.startsWith(path.sep)) {
      scriptPath = simplePath(scriptPath)
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
        sdkPath("preload/api.cjs"),
        "--require",
        sdkPath("preload/simple.cjs"),
        "--require",
        sdkPath("preload/mac.cjs"),
      ],
      //Manually set node. Shouldn't have to worry about PATH
      execPath: env.SIMPLE_NODE,
      env: {
        ...env,
        SIMPLE_PARENT_NAME:
          env.SIMPLE_PARENT_NAME || env.SIMPLE_SCRIPT_NAME,
        SIMPLE_ARGS:
          env.SIMPLE_ARGS || scriptArgs.join("."),
      },
    })

    let name = process.argv[1].replace(
      simplePath() + path.sep,
      ""
    )
    let childName = scriptPath.replace(
      simplePath() + path.sep,
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
      if (process.send) process.send(message)
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
let argv = require("minimist")(process.argv.slice(2))

args = [...argv._]
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

env = async (envKey, promptConfig = {}) => {
  if (env[envKey]) return env[envKey]

  let input = await prompt({
    message: `Set ${envKey} env to:`,
    ...promptConfig,
    cache: false,
  })

  if (input.startsWith("~"))
    input = input.replace("~", env.HOME)

  await sdk("cli/set-env-var", envKey, input)
  env[envKey] = input
  return input
}

assignPropsTo(process.env, env)

env.SIMPLE_BIN_FILE_PATH = process.argv[1]
env.SIMPLE_SRC_NAME = process.argv[1]
  .split(env.SIMPLE_PATH.split(path.sep).pop())
  .pop()

env.SIMPLE_SCRIPT_NAME = env.SIMPLE_SRC_NAME.replace(
  ".js",
  ""
)

sdkPath = (...parts) => path.join(env.SIMPLE_SDK, ...parts)
simplePath = (...parts) =>
  path.join(env.SIMPLE_PATH, ...parts)

simpleScriptFromPath = path => {
  path = path.replace(simplePath() + "/", "")
  path = path.replace(/\.js$/, "")
  return path
}

sdkScriptFromPath = path => {
  path = path.replace(env.SIMPLE_SDK + "/", "")
  path = path.replace(/\.js$/, "")
  return path
}

simpleScript = simpleScriptFromPath(env.SIMPLE_SCRIPT_NAME)

inspect = async data => {
  let dashedDate = () =>
    new Date()
      .toISOString()
      .replace("T", "-")
      .replaceAll(":", "-")
      .split(".")[0]

  let tmpFilePath = simplePath(
    "tmp",
    env.SIMPLE_SCRIPT_NAME
  )
  let tmpFullPath = path.join(
    tmpFilePath,
    `${dashedDate()}.json`
  )
  await mkdir(tmpFilePath, { recursive: true })
  await writeFile(
    tmpFullPath,
    JSON.stringify(data, null, "\t")
  )

  await edit(tmpFullPath)
}
