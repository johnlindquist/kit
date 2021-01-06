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
  copy: "copy-paste-win32fix",
  paste: "copy-paste-win32fix",
}
;({ cwd, pid, stderr, stdin, stdout, uptime } = process)

Object.entries(globalApi).forEach(([key, value]) => {
  global[key] = (...args) => {
    return require(value)[key](...args)
  }
})

const lazyLib = lib =>
  new Proxy(
    {},
    {
      get(obj, prop) {
        return require(lib)[prop]
      },
    }
  )

path = lazyLib("path")
_ = lazyLib("lodash")
chalk = lazyLib("chalk")
Handlebars = lazyLib("handlebars")

rm = () => {
  echo(
    chalk.yellow("rm") +
      ` doesn't exist. You're probably looking for ` +
      chalk.yellow("trash")
  )
}
trash = async (...trashArgs) => {
  trashArgs
    .flatMap(x => x)
    .forEach(trashArg => {
      echo(trashArg + ` moved to ` + chalk.yellow("trash"))
    })
  return await require("trash")(...trashArgs)
}

env = async (envKey, promptConfig = {}) => {
  if (env[envKey]) return env[envKey]

  let promptConfigDefaults = {
    name: "value",
    message: `Set ${envKey} env to:`,
  }

  if (promptConfig.type == "dir") {
    promptConfig = {
      ...promptConfig,
      ...{
        type: "file-tree-selection",
        onlyShowDir: true,
        root: env.HOME,
        onlyShowValid: true,
        buttonLabel: "Select",
        validate: item =>
          !_.last(item.split(path.sep)).startsWith("."),
      },
    }
  }
  if (!promptConfig.type) {
    promptConfig.type = promptConfig.choices
      ? "list"
      : "input"
  }

  let promptResult = await prompt({
    ...promptConfigDefaults,
    ...promptConfig,
  })

  let { value } = promptResult

  if (value.startsWith("~"))
    value = value.replace("~", env.HOME)

  let regex = new RegExp("^" + envKey + "=.*$")
  let { stdout } = grep(regex, env.SIMPLE_ENV_FILE)

  if (stdout == "\n") {
    let { writeNewEnv } = await import(
      "../src/simple/utils.js"
    )
    await writeNewEnv(envKey, value)
  } else {
    let { updateEnv } = await import(
      "../src/simple/utils.js"
    )
    await updateEnv(envKey, value)
  }
  env[envKey] = value

  return value
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
env.SIMPLE_SRC_PATH = path.join(env.SIMPLE_PATH, "src")
env.SIMPLE_BIN_PATH = path.join(env.SIMPLE_PATH, "bin")
env.SIMPLE_ENV_FILE = path.join(env.SIMPLE_PATH, ".env")
env.SIMPLE_BIN_TEMPLATE_PATH = path.join(
  env.SIMPLE_PATH,
  "config",
  "template-bin"
)

env.SIMPLE_TMP_PATH = path.join(env.SIMPLE_PATH, "tmp")

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
    `> Opening ${chalk.yellow(
      file
    )} with ${chalk.green.bold(env.SIMPLE_EDITOR)}`
  )

  let { tutorialCheck } = await import(
    "../src/simple/tutorial.js"
  )
  tutorialCheck()
}

let inquirer = null
let registeredPrompts = [
  "input",
  "confirm",
  "checkbox",
  "list",
]
let promptMap = {
  ["autocomplete"]: "inquirer-autocomplete-prompt",
  ["search-list"]: "inquirer-search-list", //edit, etc
  ["suggest"]: "inquirer-prompt-suggest", //datamuse
  ["file-tree-selection"]:
    "inquirer-file-tree-selection-prompt", //arg =
  ["file"]: "speajus-inquirer-directory-fork", //share-file.js
}

prompt = async config => {
  if (arg?.app && process.send) {
    process.send({ ...config })

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

  if (!config.name) config.name = "value"
  if (!inquirer) {
    inquirer = require("inquirer")
  }

  if (!registeredPrompts.includes(config.type)) {
    inquirer.registerPrompt(
      config.type,
      require(promptMap[config.type])
    )
    registeredPrompts.push(config.type)
  }

  return inquirer.prompt(config)
}

function assignPropsTo(source, target) {
  Object.entries(source).forEach(([key, value]) => {
    target[key] = value
  })
}

nextTime = command => {
  console.log(
    chalk.yellow.italic(`Next time, try typing:`),
    chalk.green.bold(command)
  )
}

arg = async (message, promptConfig = {}) => {
  if (args[0]) return args.shift()

  if (arg?.app) {
    process.send({ type: "arg", message, promptConfig })

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

    return value
  }

  let type = promptConfig.choices ? "search-list" : "input"
  if (promptConfig.type == "dir") {
    promptConfig = {
      ...promptConfig,
      ...{
        type: "file-tree-selection",
        onlyShowDir: true,
        root: env.HOME,
        onlyShowValid: true,
        validate: item =>
          !_.last(item.split(path.sep)).startsWith("."),
      },
    }
  }
  promptConfig = {
    message,
    type,
    name: "name",
    ...promptConfig,
  }

  return (await prompt(promptConfig))[promptConfig["name"]]
}
const yargs = require("yargs/yargs")
const { hideBin } = require("yargs/helpers")
const yargV = yargs(hideBin(process.argv)).help(false).argv

assignPropsTo(yargV, arg)
assignPropsTo(yargV._, arg)
args = process.argv.slice(2)

need = async packageName => {
  try {
    return await import(packageName)
  } catch {
    const yellowName = chalk.yellow(packageName)

    let installMessage =
      "\n" +
      chalk.green(env.SIMPLE_SCRIPT_NAME) +
      ` wants to download the npm package ` +
      yellowName
    echo(installMessage)

    let downloadsMessage =
      yellowName +
      ` has had ` +
      chalk.yellow(
        (
          await get(
            `https://api.npmjs.org/downloads/point/last-week/` +
              packageName
          )
        ).data.downloads
      ) +
      ` downloads from npm in the past week`
    echo(downloadsMessage)

    let packageLink = `https://npmjs.com/package/${packageName}`
    let readMore = `
Read more about ${yellowName} here: ${chalk.yellow(
      packageLink
    )}
`
    if (!arg?.trust) {
      echo(readMore)
      let message = `Do you trust ${yellowName}?`

      if (arg?.app && process.send) {
        let stripAnsi = require("strip-ansi")
        message = stripAnsi(message)
        readMore = stripAnsi(readMore)
        downloadsMessage = stripAnsi(downloadsMessage)
        installMessage = stripAnsi(installMessage)
      }

      let { trust } = await prompt({
        name: "trust",
        message,
        type: "confirm",
        readMore,
        installMessage,
        downloadsMessage,
        packageName,
        packageLink,
      })
      if (!trust) {
        echo(`Ok. Exiting...`)
        exit()
      }
    }
    echo(`Installing ${yellowName} and re-running.`)
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

run = async (script, ...runArgs) =>
  new Promise((res, rej) => {
    let values = []
    let sub = fork(
      path.join(env.SIMPLE_SRC_PATH, script + ".js"),
      [...args, ...runArgs],
      { stdio: "inherit" }
    )
    args = []

    sub.on("message", message => {
      values.push(message)
    })

    sub.on("error", error => {
      values.push(error)
      rej(values)
    })

    sub.on("close", code => {
      res(values)
    })
  })

wait = async time =>
  new Promise(res => setTimeout(res, time))

show = async (html, options) => {
  let showHtml = path.join(env.SIMPLE_TMP_PATH, "show.html")
  await writeFile(showHtml, html)

  process.send({
    ...options,
    type: "window",
    frame: false,
    titleBarStyle: "customButtonsOnHover",
    url: "file://" + showHtml,
  })
}

checkProcess = pid => {
  let { stdout, stderr } = exec(`kill -0 ` + pid)
  //if running, stdout has text. If not, stdout is an empty string
  return stdout
}

let checkFlags = async () => {
  if (arg?.edit) {
    await edit(path.join(env.SIMPLE_SRC_PATH, arg?.$0))
    exit()
  }
  if (arg?.rm) {
    let { removeScript } = await import(
      path.join(
        env.SIMPLE_SRC_PATH,
        "simple",
        "removeScript.js"
      )
    )
    await removeScript(env.SIMPLE_SCRIPT_NAME)
    exit()
  }
}

checkFlags()
