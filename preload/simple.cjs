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
        PATH: env.SIMPLE_NODE_BIN + ":" + env.PATH,
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

simplify = async lib => {
  try {
    return await import(simplePath(`simplify`, `${lib}.js`))
  } catch (error) {
    console.log(error)
    console.log(`Simplifier for ${lib} doesn't exist`)
    exit()
  }
}

simple = async (scriptPath, ..._args) => {
  simpleScript = simpleScriptFromPath(scriptPath)
  args.push(..._args)
  let simpleScriptPath = scriptPath.includes("/")
    ? simplePath(scriptPath) + ".js"
    : simplePath("scripts", scriptPath) + ".js"

  //import caches loaded scripts, so we cache-bust with a uuid in case we want to load a script twice
  try {
    return await import(simpleScriptPath + `?uuid=${v4()}`)
  } catch (error) {
    console.log(error)
    exit()
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
        simplePath("/preload/api.cjs"),
        "--require",
        simplePath("/preload/simple.cjs"),
        "--require",
        simplePath("/preload/mac.cjs"),
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
      // console.log(`simple error`, { error })
      values.push(error)
      rej(values)
    })

    child.on("close", code => {
      process.off("message", forwardToChild)
      res(values)
    })
  })
}

process.on("uncaughtException", err => {
  console.log(err)
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

  await simple("cli/set-env-var", envKey, input)
  env[envKey] = input
  return input
}

assignPropsTo(process.env, env)

env.SIMPLE_BIN_FILE_PATH = process.argv[1]
env.SIMPLE_SRC_NAME = process.argv[1]
  .split(".simple/")
  .pop()

env.SIMPLE_SCRIPT_NAME = env.SIMPLE_SRC_NAME.replace(
  ".js",
  ""
)

simplePath = (...parts) =>
  path.join(env.SIMPLE_PATH, ...parts)

simpleScriptFromPath = path => {
  path = path.replace(env.SIMPLE_PATH + "/", "")
  if (!path.includes("/")) path = "scripts/" + path
  path = path.replace(/\.js$/, "")
  return path
}

simpleScript = simpleScriptFromPath(env.SIMPLE_SCRIPT_NAME)

env.SIMPLE_SCRIPTS_PATH = path.join(
  env.SIMPLE_PATH,
  "scripts"
)
env.SIMPLE_BIN_PATH = simplePath("bin")
env.SIMPLE_ENV_FILE = simplePath(".env")
env.SIMPLE_BIN_TEMPLATE_PATH = simplePath(
  "config",
  "template-bin"
)

env.SIMPLE_TMP_PATH = simplePath("tmp")
env.SIMPLE_NODE_PATH = simplePath("node_modules")
let nodeBin = ["node", "bin"]
env.SIMPLE_NODE_BIN = simplePath(...nodeBin)
env.SIMPLE_NODE = simplePath(...nodeBin, "node")
env.SIMPLE_NPM = simplePath(...nodeBin, "npm")
