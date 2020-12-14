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
  rm: "shelljs",
  sed: "shelljs",
  tempdir: "shelljs",
  test: "shelljs",
  which: "shelljs",
  spawn: "child_process",
  get: "axios",
  put: "axios",
  post: "axios",
  patch: "axios",
  readFile: "fs/promises",
  writeFile: "fs/promises",
  readdir: "fs/promises",
  copy: "copy-paste-win32fix",
  paste: "copy-paste-win32fix",
}

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
global.prompt = config => {
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

args = process.argv.slice(2)
const yargs = require("yargs/yargs")
const { hideBin } = require("yargs/helpers")
assignPropsTo(
  yargs(hideBin(process.argv)).help(false).argv,
  args
)

process.env.SIMPLE_BIN_FILE_PATH = process.argv[1]
process.env.SIMPLE_SRC_NAME = /[^/]*$/.exec(
  process.env.SIMPLE_BIN_FILE_PATH
)[0]

process.env.SIMPLE_SCRIPT_NAME = process.env.SIMPLE_SRC_NAME.replace(
  ".js",
  ""
)
process.env.SIMPLE_SRC_PATH = path.join(
  process.env.SIMPLE_PATH,
  "src"
)
process.env.SIMPLE_BIN_PATH = path.join(
  process.env.SIMPLE_PATH,
  "bin"
)
process.env.SIMPLE_ENV_FILE = path.join(
  process.env.SIMPLE_PATH,
  ".env"
)
process.env.SIMPLE_BIN_TEMPLATE_PATH = path.join(
  process.env.SIMPLE_PATH,
  "config",
  "template-bin"
)

launchEditor = async (file, dir, line = 0, col = 0) => {
  if (process.env.SIMPLE_EDITOR == "code") {
    let codeArgs = ["--goto", `${file}:${line}:${col}`]
    if (dir) codeArgs = [...codeArgs, "--folder-uri", dir]
    let child = spawn("code", codeArgs, {
      stdio: "inherit",
    })

    child.on("exit", function (e, code) {
      // console.log("code launched: ", file)
    })
  } else {
    let editorArgs = [file]
    if (process.env.SIMPLE_EDITOR.includes("vi"))
      editorArgs.push(">/dev/tty")
    let child = spawn(
      process.env.SIMPLE_EDITOR,
      editorArgs,
      {
        stdio: "inherit",
      }
    )

    child.on("exit", function (e, code) {
      // console.log(process.env.SIMPLE_EDITOR, " opened: ", file)
    })
  }
  echo(
    `> Opening ${chalk.yellow(
      file
    )} with ${chalk.green.bold(process.env.SIMPLE_EDITOR)}`
  )

  let { tutorialCheck } = await import(
    "../src/simple/tutorial.js"
  )
  tutorialCheck()
}

nextTime = command => {
  console.log(
    chalk.yellow.italic(`Next time, try typing:`),
    chalk.green.bold(command)
  )
}

let argIndex = 0
arg = async (
  message,
  promptConfig = {},
  key = argIndex++
) => {
  if (arg[key]) return arg[key]
  let type = promptConfig.choices ? "search-list" : "input"
  if (promptConfig.type == "dir") {
    promptConfig = {
      ...promptConfig,
      ...{
        type: "file-tree-selection",
        onlyShowDir: true,
        root: process.env.HOME,
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
assignPropsTo(args, arg)

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
        root: process.env.HOME,
        onlyShowValid: true,
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

  let { value } = await prompt({
    ...promptConfigDefaults,
    ...promptConfig,
  })

  let regex = new RegExp("^" + envKey + "=.*$")
  let { stdout } = grep(regex, process.env.SIMPLE_ENV_FILE)

  let envKeyValue = envKey + "=" + value

  if (stdout == "\n") {
    let { writeNewEnv, updateEnv } = await import(
      "../src/simple/utils.js"
    )
    await writeNewEnv(envKeyValue)
  } else {
    await updateEnv(envKey, value)
  }
  process.env[envKey] = value

  if (value.includes("~")) {
    value = require("untildify")(value)
  }
  return value
}

assignPropsTo(process.env, env)

need = async packageName => {
  try {
    return await import(packageName)
  } catch {
    //experimenting with "need" and "re-run if missing"
    const yellowName = chalk.yellow(packageName)

    let installMessage =
      "\n" +
      chalk.green(process.env.SIMPLE_SCRIPT_NAME) +
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

    let readMore = `
Read more about ${yellowName} here: ${chalk.yellow(
      `https://npmjs.com/package/${packageName}`
    )}
`
    echo(readMore)
    let message = `Do you trust ${yellowName}?`
    let { trust } = await prompt({
      name: "trust",
      message,
      type: "confirm",
    })
    if (!trust) {
      echo(`Ok. Exiting...`)
      exit()
    }
    echo(`Installing ${yellowName} and re-running.`)
    let child = spawn(`simple`, ["i", packageName], {
      stdio: "inherit",
    })
    await new Promise(res => child.on("exit", res))
    child = spawn(
      process.env.SIMPLE_SCRIPT_NAME,
      [...args],
      {
        stdio: "inherit",
      }
    )
    await new Promise(res => child.on("exit", res))
    exit()
  }
}
