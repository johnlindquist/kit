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

send = (...args) => {
  if (process && process.send) {
    process.send(...args)
  } else {
    console.log(
      chalk`{yellow.bold No parent process found}. Logging instead:`
    )
    console.log(...args)
  }
}

env = async (envKey, promptConfig = {}) => {
  if (env[envKey]) return env[envKey]

  let input = await prompt({
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

simplePath = (...parts) =>
  path.join(env.SIMPLE_PATH, ...parts)

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
      choices: possibleEditors
        .filter(editor => which(editor))
        .map(editor => which(editor).toString().trim()),
    })) == which("code")
  ) {
    let codeArgs = ["--goto", `${file}:${line}:${col}`]
    if (dir) codeArgs = [...codeArgs, "--folder-uri", dir]
    let editor = spawn(env.SIMPLE_EDITOR, codeArgs, {
      stdio: "inherit",
    })

    editor.on("exit", function (e, code) {
      // console.log("code launched: ", file)
    })
  } else {
    let editorArgs = [file]
    let editor = spawn(env.SIMPLE_EDITOR, editorArgs, {
      stdio: "inherit",
    })

    editor.on("exit", function (e, code) {
      // console.log(env.SIMPLE_EDITOR, " opened: ", file)
    })
  }
  echo(
    chalk`> Opening {yellow ${file}} with {green.bold ${env.SIMPLE_EDITOR}}`
  )
}

prompt = async config => {
  if (config?.choices) {
    config = { ...config, type: "autocomplete" }
  }
  config = { type: "input", name: "value", ...config }
  if (arg?.app && process.send) {
    if (typeof config.choices === "function") {
      config = { ...config, type: "lazy" }
    }

    if (typeof config?.choices === "object") {
      config = {
        ...config,
        choices: config.choices.map(choice => {
          if (typeof choice === "string") {
            return {
              name: choice,
              value: choice,
            }
          }
          return choice
        }),
      }
    }

    if (setFrontMost) setFrontMost()
    process.send({ ...config, from: "prompt" })

    let resolve = null
    let reject = null

    let value = await new Promise((res, rej) => {
      resolve = res
      reject = rej

      process.on("message", async data => {
        //The App is requesting to run the arg choices func
        // console.log("process.on('message'):", data)
        if (
          data?.from === "input" &&
          typeof config?.choices == "function"
        ) {
          process.send({
            from: "choices",
            choices: (
              await config.choices(data?.input)
            ).map(choice => {
              console.log({ choice })
              if (typeof choice === "string") {
                return {
                  name: choice,
                  value: choice,
                }
              }
              return choice
            }),
          })

          return
        }

        //The App returned normal data
        res(data)
      })
      process.on("error", reject)
    })

    // process.off("message", resolve)
    // process.off("error", reject)

    process.removeAllListeners()
    return value
  }

  if (typeof config.choices === "function") {
    let f = config.choices

    let suggest = _.debounce(async function (input) {
      let results = await f(
        input.replace(/[^0-9a-z]/gi, "")
      )
      this.choices = await this.toChoices(results)
      await this.render()

      return this.choices
    }, 250)

    config = {
      ...config,
      choices: [],
      suggest,
    }
  }

  let { value } = await require("enquirer").prompt(config)

  return value
}

function assignPropsTo(source, target) {
  Object.entries(source).forEach(([key, value]) => {
    target[key] = value
  })
}

arg = async (message = "Input", promptConfig = {}) => {
  //app sends ['', '--app]
  if (arg?.app && args[0] == "") args = []
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

  let input = await prompt({
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
  .flatMap(([key, value]) => {
    if (typeof value === "boolean") {
      if (value) return [`--${key}`]
      if (!value) return [`--no-${key}`]
    }
    return [`--${key}`, value]
  })

assignPropsTo(argv, arg)

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

need = async packageName => {
  try {
    return await import(packageName)
  } catch {
    if (!arg?.trust) {
      let installMessage = chalk`\n{green ${env.SIMPLE_SCRIPT_NAME}} needs to install the npm library: {yellow ${packageName}}`

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
      if (!arg?.app) {
        echo(installMessage)
        echo(downloadsMessage)
        echo(readMore)
      }
      let message = chalk`Do you trust {yellow ${packageName}}?`

      let config = {
        message,
        choices: [
          { name: "Yes", value: true },
          { name: "No", value: false },
        ],
      }

      if (arg?.app && process.send) {
        let stripAnsi = require("strip-ansi")
        message = stripAnsi(message).trim()
        readMore = stripAnsi(readMore).trim()

        downloadsMessage = stripAnsi(
          downloadsMessage
        ).trim()

        installMessage = stripAnsi(installMessage).trim()

        //https://www.electronjs.org/docs/api/dialog#dialogshowmessageboxbrowserwindow-options
        config = {
          ...config,
          message,
          choices: config.choices.map(choice => {
            return {
              ...choice,
              display: `<div>
        <div>${installMessage}</div>
        <div>${downloadsMessage}</div>
        <div>${readMore}</div>
        </div>`,
            }
          }),
        }
      }

      let trust = await prompt(config)
      if (!trust) {
        echo(`Ok. Exiting...`)
        exit()
      }
    }
    echo(
      chalk`Installing {yellow ${packageName}} and continuing.`
    )

    await install([packageName])
    let packageJson = require(simplePath(
      "node_modules",
      packageName,
      "package.json"
    ))

    return await import(
      simplePath(
        "node_modules",
        packageName,
        packageJson.main
      )
    )
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

run = async (scriptPath, ...runArgs) => {
  return new Promise(async (res, rej) => {
    let values = []
    if (!scriptPath.startsWith(path.sep)) {
      scriptPath = simplePath(scriptPath)
    }

    if (!scriptPath.endsWith(".js"))
      scriptPath = scriptPath + ".js"

    // console.log({ scriptPath, args, argOpts, runArgs })
    let child = fork(
      scriptPath,
      [...args, ...runArgs, ...argOpts].filter(arg => {
        if (typeof arg === "string") return arg.length > 0

        return arg
      }),
      {
        stdio: "inherit",
        execArgv: [
          "--require",
          "dotenv/config",
          "--require",
          simplePath("/preload/core.cjs"),
          "--require",
          simplePath("/preload/system.cjs"),
        ],
        //Manually set node. Shouldn't have to worry about PATH
        execPath: env.SIMPLE_NODE,
        env: {
          ...env,
          SIMPLE_PARENT_NAME: env.SIMPLE_SCRIPT_NAME,
          SIMPLE_PARENT_ARGS: runArgs,
          front,
        },
      }
    )

    let forwardToChild = message => {
      child.send(message)
    }
    process.on("message", forwardToChild)

    child.on("message", message => {
      if (process.send) process.send(message)
      values.push(message)
    })

    child.on("error", error => {
      values.push(error)
      rej(values)
    })

    child.on("close", code => {
      process.off("message", forwardToChild)
      child.removeAllListeners()
      res(values)
    })
  })
}

wait = async time =>
  new Promise(res => setTimeout(res, time))

checkProcess = pid => {
  let { stdout, stderr } = exec(`kill -0 ` + pid)
  //if running, stdout has text. If not, stdout is an empty string
  return stdout
}

// let checkFlags = async () => {
//   console.log({ edit: arg?.edit, rm: arg?.rm })
//   if (arg?.edit === true) {
//     await edit(path.join(env.SIMPLE_SCRIPTS_PATH, arg?.$0))
//     exit()
//   }
//   if (arg?.rm === true) {
//     let { removeScript } = await import(
//       path.join(
//         env.SIMPLE_SCRIPTS_PATH,
//         "simple",
//         "removeScript.js"
//       )
//     )
//     await removeScript(env.SIMPLE_SCRIPT_NAME)
//     exit()
//   }
// }

// checkFlags()

process.on("uncaughtException", err => {
  console.log(err)
  exit()
})
