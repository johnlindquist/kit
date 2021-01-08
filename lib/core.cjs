//cjs is required to load/assign the content of this script synchronously
//we may be able to convert this to .js if an "--import" flag is added
//https://github.com/nodejs/node/issues/35103

globalApi = {
  cd: "shelljs",
  cp: "shelljs",
  chmod: "shelljs",
  echo: "shelljs",
  exec: "shelljs",
  exit: "shelljs",
  grep: "shelljs",
  ln: "shelljs",
  ls: "shelljs",
  mkdir: "shelljs",
  mv: "shelljs",
  sed: "shelljs",
  tempdir: "shelljs",
  test: "shelljs",
  which: "shelljs",
  spawn: "child_process",
  spawnSync: "child_process",
  fork: "child_process",
  get: "axios",
  put: "axios",
  post: "axios",
  patch: "axios",
  readFile: "fs/promises",
  writeFile: "fs/promises",
  createWriteStream: "fs",
  readdir: "fs/promises",
  compile: "handlebars",
}
;({ cwd, pid, stderr, stdin, stdout, uptime } = process)

Object.entries(globalApi).forEach(([key, value]) => {
  global[key] = (...args) => {
    return require(value)[key](...args)
  }
})

path = require("path")

_ = new Proxy(
  {},
  {
    get(o, p) {
      return require("lodash")[p]
    },
  }
)
chalk = (...args) => require("chalk")(...args)

paste = (...args) => require("clipboardy").read(...args)
copy = (...args) => require("clipboardy").write(...args)

rm = () => {
  echo(
    chalk`{yellow rm} doesn't exist. You're probably looking for {yellow trash}`
  )
}
trash = async (...trashArgs) => {
  trashArgs
    .flatMap(x => x)
    .forEach(trashArg => {
      echo(
        chalk`{yellow ${trashArg}} moved to {yellow trash}`
      )
    })
  return await require("trash")(...trashArgs)
}

env = async (envKey, promptConfig = {}) => {
  if (env[envKey]) return env[envKey]

  let { input } = await prompt({
    name: "input",
    type: "input",
    message: `Set ${envKey} env to:`,
    ...promptConfig,
  })

  if (input.startsWith("~"))
    input = input.replace("~", env.HOME)

  await run("cli/set-env-var", envKey, input)
  env[envKey] = input
  return input
}

assignPropsTo(process.env, env)

env.SIMPLE_BIN_FILE_PATH = process.argv[1]
env.SIMPLE_SRC_NAME = /[^/]*$/.exec(
  env.SIMPLE_BIN_FILE_PATH
)[0]

env.SIMPLE_SCRIPT_NAME = env.SIMPLE_SRC_NAME.replace(
  ".js",
  ""
)
env.SIMPLE_SCRIPTS_PATH = path.join(
  env.SIMPLE_PATH,
  "scripts"
)
env.SIMPLE_BIN_PATH = path.join(env.SIMPLE_PATH, "bin")
env.SIMPLE_ENV_FILE = path.join(env.SIMPLE_PATH, ".env")
env.SIMPLE_BIN_TEMPLATE_PATH = path.join(
  env.SIMPLE_PATH,
  "config",
  "template-bin"
)

env.SIMPLE_TMP_PATH = path.join(env.SIMPLE_PATH, "tmp")

env.SIMPLE_NODE = path.join(
  env.SIMPLE_PATH,
  "node",
  "bin",
  "node"
)
env.SIMPLE_NPM = path.join(
  env.SIMPLE_PATH,
  "node",
  "bin",
  "npm"
)

const possibleEditors = [
  "atom",
  "code",
  "emacs",
  "nano",
  "ne",
  "nvim",
  "sublime",
  "webstorm",
  "vim",
]

edit = async (file, dir, line = 0, col = 0) => {
  if (arg?.edit == false) return
  if (
    (await env("SIMPLE_EDITOR", {
      message:
        "Which code editor do you use? (You can always change this later in .env)",
      choices: () =>
        possibleEditors
          .filter(editor => which(editor))
          .map(editor => which(editor).toString().trim()),
    })) == which("code")
  ) {
    let codeArgs = ["--goto", `${file}:${line}:${col}`]
    if (dir) codeArgs = [...codeArgs, "--folder-uri", dir]
    let child = spawn(env.SIMPLE_EDITOR, codeArgs, {
      stdio: "inherit",
    })

    child.on("exit", function (e, code) {
      // console.log("code launched: ", file)
    })
  } else {
    let editorArgs = [file]
    let child = spawn(env.SIMPLE_EDITOR, editorArgs, {
      stdio: "inherit",
    })

    child.on("exit", function (e, code) {
      // console.log(env.SIMPLE_EDITOR, " opened: ", file)
    })
  }
  echo(
    chalk`> Opening {yellow ${file}} with {green.bold ${env.SIMPLE_EDITOR}}`
  )
}

prompt = async (config = { type: "input" }) => {
  if (arg?.app && process.send) {
    process.send({ from: "prompt", ...config })

    let resolve = null
    let reject = null

    let value = await new Promise((res, rej) => {
      resolve = res
      reject = rej

      process.on("message", resolve)
      process.on("error", reject)
    })

    process.off("message", resolve)
    process.off("error", reject)

    return { name: value, [config.name]: value, value }
  }

  return require("enquirer").prompt(config)
}

function assignPropsTo(source, target) {
  Object.entries(source).forEach(([key, value]) => {
    target[key] = value
  })
}

arg = async (message = "Input", promptConfig = {}) => {
  if (args[0]) {
    let attemptArg = args.shift()
    if (promptConfig?.validate) {
      let validate = promptConfig.validate
      let valid = false
      if (validate.constructor.name == "AsyncFunction") {
        valid = await validate(attemptArg)
      } else {
        valid = validate(attemptArg)
      }
      if (typeof valid == "boolean" && valid) {
        return attemptArg
      } else {
        //don't return, just update message
        promptConfig.message = valid
      }
    } else {
      return attemptArg
    }
  }

  let { input } = await prompt({
    type: "input",
    name: "input",
    message,
    ...promptConfig,
  })

  let command = chalk`{green.bold ${
    env.SIMPLE_SCRIPT_NAME
  } {yellow ${input}}} {yellow ${argOpts.join(" ")}}`

  // if (process.env?.SIMPLE_PARENT_NAME == "simple") {
  //   command = chalk`{green.bold simple} ` + command
  // }
  let nextTime =
    chalk`👉 Run without prompts by typing: ` + command
  console.log(nextTime)

  return input
}

let argv = require("minimist")(process.argv.slice(2))

args = [...argv._]
argOpts = Object.entries(argv)
  .filter(([key]) => key != "_")
  .flatMap(([key, value]) => [`--${key}`, value])

assignPropsTo(argv, arg)

need = async packageName => {
  try {
    return await import(packageName)
  } catch {
    if (!arg?.trust) {
      let installMessage = chalk`\n{green ${env.SIMPLE_SCRIPT_NAME}} want to download the npm package {yellow ${packageName}}`

      let downloadsMessage = chalk`{yellow ${packageName}} has had {yellow ${
        (
          await get(
            `https://api.npmjs.org/downloads/point/last-week/` +
              packageName
          )
        ).data.downloads
      }} downloads from npm in the past week`

      let packageLink = `https://npmjs.com/package/${packageName}`
      let readMore = chalk`
  Read more about {yellow ${packageName}} here: {yellow ${packageLink}}
  `
      let buttons = [
        "Trust",
        "Cancel",
        "Read About " + packageName,
      ]

      if (!arg?.app) {
        echo(installMessage)
        echo(downloadsMessage)
        echo(readMore)
      }
      let message = chalk`Do you trust {yellow ${packageName}}?`

      let config = {
        name: "trust",
        message,
        type: "confirm",
      }

      if (arg?.app && process.send) {
        let stripAnsi = require("strip-ansi")
        message = stripAnsi(message).trim()
        readMore = stripAnsi(readMore).trim()

        downloadsMessage = stripAnsi(
          downloadsMessage
        ).trim()

        installMessage = stripAnsi(installMessage).trim()
        type = "question"
        let detail =
          installMessage.trim() +
          "\n\n" +
          downloadsMessage.trim()

        //https://www.electronjs.org/docs/api/dialog#dialogshowmessageboxbrowserwindow-options
        config = {
          type: "question",
          from: "need",
          icon: "assets/icon.png",
          buttons,
          defaultId: buttons.indexOf("Trust"),
          message,
          detail,
        }
      }

      let trust = false
      //TODO: Make prompt returns values consistent between inquirer and electron prompts
      let result = await prompt(config)
      if (typeof result.value?.response == "number") {
        let { response } = result.value
        trust = buttons[response] == "Trust"

        if (buttons[response].startsWith("Read")) {
          exec(`open ` + packageLink)
          exit()
        }
      } else {
        trust = result.trust
      }
      if (!trust) {
        echo(`Ok. Exiting...`)
        exit()
      }
    }
    echo(
      chalk`Installing {yellow ${packageName}} and re-running.`
    )
    let options = {
      stdio: "inherit",
      env: {
        ...env,
        PATH: env.SIMPLE_BIN_PATH + ":" + env.PATH,
      },
    }

    let child = spawn(`simple`, ["i", packageName], options)
    await new Promise(res => child.on("exit", res))
    child = spawn(
      env.SIMPLE_SCRIPT_NAME,
      [...args],
      options
    )
    await new Promise(res => child.on("exit", res))
    exit(0)
  }
}

simplify = async lib => {
  try {
    return await import(`../src/simplify/${lib}.js`)
  } catch (error) {
    console.log(error)
    console.log(`Simplifier for ${lib} doesn't exist`)
    exit()
  }
}

run = async (scriptPath, ...runArgs) =>
  new Promise(async (res, rej) => {
    let values = []
    if (!scriptPath.startsWith(path.sep)) {
      scriptPath = path.join(env.SIMPLE_PATH, scriptPath)
    }
    let child = fork(
      scriptPath,
      [...args, ...argOpts, ...runArgs],
      {
        stdio: "inherit",
        execArgv: [
          "--require",
          "dotenv/config",
          "--require",
          path.join(env.SIMPLE_PATH, "/lib/core.cjs"),
        ],
        execPath: env.SIMPLE_NODE,
        env: {
          ...env,
          SIMPLE_PARENT_NAME: env.SIMPLE_SCRIPT_NAME,
          SIMPLE_PARENT_ARGS: runArgs,
        },
      }
    )

    child.on("message", message => {
      values.push(message)
    })

    child.on("error", error => {
      values.push(error)
      rej(values)
    })

    child.on("close", code => {
      res(values)
    })
  })

wait = async time =>
  new Promise(res => setTimeout(res, time))

checkProcess = pid => {
  let { stdout, stderr } = exec(`kill -0 ` + pid)
  //if running, stdout has text. If not, stdout is an empty string
  return stdout
}

let checkFlags = async () => {
  if (arg?.edit) {
    await edit(path.join(env.SIMPLE_SCRIPTS_PATH, arg?.$0))
    exit()
  }
  if (arg?.rm) {
    let { removeScript } = await import(
      path.join(
        env.SIMPLE_SCRIPTS_PATH,
        "simple",
        "removeScript.js"
      )
    )
    await removeScript(env.SIMPLE_SCRIPT_NAME)
    exit()
  }
}

checkFlags()
