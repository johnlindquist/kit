//cjs is required to load/assign the content of this script synchronously
//we may be able to convert this to .js if an "--import" flag is added
//https://github.com/nodejs/node/issues/35103

const globalApi = {
  chmod: "shelljs",
  echo: "shelljs",
  exec: "shelljs",
  grep: "shelljs",
  ln: "shelljs",
  ls: "shelljs",
  mkdir: "shelljs",
  mv: "shelljs",
  rm: "shelljs",
  sed: "shelljs",
  tempdir: "shelljs",
  test: "shelljs",
  spawn: "child_process",
  get: "axios",
  put: "axios",
  post: "axios",
  patch: "axios",
  readFile: "fs/promises",
  writeFile: "fs/promises",
  readdir: "fs/promises",
  copy: "copy-paste",
  paste: "copy-paste",
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
let registeredPrompts = ["input", "confirm", "checkbox"]
let promptMap = {
  ["autocomplete"]: "inquirer-autocomplete-prompt",
  ["search-list"]: "inquirer-search-list",
  ["suggest"]: "inquirer-prompt-suggest",
  ["file-tree-selection"]:
    "inquirer-file-tree-selection-prompt",
}
global.prompt = config => {
  if (!inquirer) {
    inquirer = require("inquirer")
  }

  if (!registeredPrompts.includes(config.type)) {
    registeredPrompts.push(config.type)
    inquirer.registerPrompt(
      config.type,
      require(promptMap[config.type])
    )
  }
  return inquirer.prompt(config)
}

function assignPropsTo(source, target) {
  Object.entries(source).forEach(([key, value]) => {
    target[key] = value
  })
}

const args = process.argv.slice(2)
const yargs = require("yargs/yargs")
const { hideBin } = require("yargs/helpers")
assignPropsTo(
  yargs(hideBin(process.argv)).help(false).argv,
  args
)

const tutorialCheck = () => {
  if (
    process.env.TUTORIAL_CONTENT_PATH &&
    process.env.SIMPLE_TEMPLATE == "tutorial"
  ) {
    echo(
      `

Congratulations! You're ready to explore the wonderful world of Simple Scripts. 🥳

* Type ${chalk.green.bold(
        "simple"
      )} in your terminal to keep exploring features.
* Create new scripts by typing ${chalk.green.bold("new")} .
* Review the included examples by typing ${chalk.green.bold(
        "edit"
      )} 👀
  `.trim()
    )

    updateEnvKey("SIMPLE_TEMPLATE", "default")
  }
}

const symFilePath = process.argv[1]
const scriptName = /[^/]*$/.exec(symFilePath)[0]
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

const createBinFilePath = name =>
  path.join(process.env.SIMPLE_BIN_PATH, name)

const createSourceFilePath = name =>
  path.join(process.env.SIMPLE_SRC_PATH, name + ".js")

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
  tutorialCheck()
}

applescript = script =>
  exec(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`)

//TODO: check OS
say = string => {
  applescript(`say "${string}" speaking rate 250`)
}

//TODO: check OS
notify = (title, subtitle) => {
  applescript(
    `display notification with title "${title}" subtitle "${subtitle}"`
  )
}

//TODO: check OS
preview = file => {
  exec(`qlmanage -p "${file}"`, { silent: true })
}

const updateEnvKey = (envKey, envValue) => {
  let regex = new RegExp("^" + envKey + "=.*$")
  sed(
    "-i",
    regex,
    envKey + "=" + envValue,
    process.env.SIMPLE_ENV_FILE
  )
}

const writeNewEnvKey = envKeyValue => {
  new ShellString("\n" + envKeyValue).toEnd(
    process.env.SIMPLE_ENV_FILE
  )
}

renameScript = async (oldName, newName) => {
  const oldSourcePath = createSourceFilePath(oldName)
  const oldBinPath = createBinFilePath(oldName)
  const newSourcePath = createSourceFilePath(newName)
  rm(oldBinPath)
  mv(oldSourcePath, newSourcePath)
  createBinFile(newName)
  if (oldName == process.env.SIMPLE_NAME) {
    updateEnvKey("SIMPLE_NAME", newName)
  }
}

const createBinFile = async name => {
  let binTemplate = await readFile(
    process.env.SIMPLE_BIN_TEMPLATE_PATH,
    "utf8"
  )
  binTemplate = Handlebars.compile(binTemplate)
  binTemplate = binTemplate({ name })

  let binFilePath = createBinFilePath(name)
  await writeFile(binFilePath, binTemplate)
  chmod(755, binFilePath)
}

copyScript = async (source, target) => {
  //TODO: not finding my `g` git alias
  let result = exec(`type ${target}`, {
    silent: true,
  })
  if (result.stdout) {
    console.log(`${target} already exists. 
  ${result.stdout.trim()}
  Aborting...`)
    exit()
  }

  const newSrcFilePath = path.join(
    process.env.SIMPLE_SRC_PATH,
    target + ".js"
  )

  const sourceFilePath = createSourceFilePath(source)
  cp(sourceFilePath, newSrcFilePath)
  await createBinFile(target)

  launchEditor(newSrcFilePath, process.env.SIMPLE_PATH)
}

removeScript = async name => {
  rm(createBinFilePath(name))
  rm(createSourceFilePath(name))
  echo(`Removed script: ` + chalk.green.bold(name))
}

createScript = async name => {
  let template = await env("SIMPLE_TEMPLATE")
  let result = exec(`type ${name}`, { silent: true })
  if (result.stdout) {
    console.log(`${name} already exists. 
${result.stdout.trim()}
Aborting...`)
    exit()
  }

  let simpleTemplatePath = path.join(
    process.env.SIMPLE_PATH,
    "templates",
    template + ".js"
  )

  let simpleTemplate = await readFile(
    simpleTemplatePath,
    "utf8"
  )
  simpleTemplate = Handlebars.compile(simpleTemplate)
  simpleTemplate = simpleTemplate({
    ...env,
    name,
  })

  let simpleFilePath = createSourceFilePath(name)

  await writeFile(simpleFilePath, simpleTemplate)
  await createBinFile(name)

  let greenName = chalk.green.bold(name)
  let yellowTemplate = chalk.yellow(template)

  echo(
    `\n> Created a ${greenName} script using the ${yellowTemplate} template.`
  )

  let line = 0
  let col = 0
  if (template == "default") {
    line = 2
    col = 17
  }

  launchEditor(
    simpleFilePath,
    process.env.SIMPLE_PATH,
    line,
    col
  )
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
    writeNewEnvKey(envKeyValue)
  } else {
    updateEnvKey(envKey, value)
  }

  if (value.includes("~")) {
    value = require("untildify")(value)
  }
  return value
}

assignPropsTo(process.env, env)

getScripts = async () => {
  let result = ls(
    "-l",
    path.join(process.env.SIMPLE_PATH, "bin")
  )
  return result.map(file => file)
}
