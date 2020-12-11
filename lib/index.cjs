//cjs is required to load/assign the content of this script synchronously
//we may be able to convert this to .js if an "--import" flag is added
//https://github.com/nodejs/node/issues/35103

function assignPropsTo(source, target) {
  Object.entries(source).forEach(([key, value]) => {
    target[key] = value
  })
}

assignPropsTo(require("shelljs"), global)
const args = process.argv.slice(2)
const yargs = require("yargs/yargs")
const { hideBin } = require("yargs/helpers")
assignPropsTo(
  yargs(hideBin(process.argv)).help(false).argv,
  args
)

child_process = require("child_process")
spawn = child_process.spawn
_ = require("lodash")
path = require("path")
inquirer = require("inquirer")
inquirer.registerPrompt(
  "autocomplete",
  require("inquirer-autocomplete-prompt")
)
inquirer.registerPrompt(
  "search-list",
  require("inquirer-search-list")
)

inquirer.registerPrompt(
  "suggest",
  require("inquirer-prompt-suggest")
)

inquirer.registerPrompt(
  "file-tree-selection",
  require("inquirer-file-tree-selection-prompt")
)

prompt = inquirer.prompt
Separator = inquirer.Separator
chalk = require("chalk")

axios = require("axios")
get = axios.get
post = axios.post
put = axios.put
patch = axios.patch

const fsPromises = require("fs/promises")
const fs = require("fs")

readFile = fsPromises.readFile

const tutorialCheck = () => {
  if (
    env.TUTORIAL_CONTENT_PATH &&
    env.SIMPLE_TEMPLATE == "tutorial"
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

writeFile = (...args) => {
  return fsPromises.writeFile(...args)
}
readdir = fsPromises.readdir

const copyPaste = require("copy-paste")
copy = copyPaste.copy
paste = copyPaste.paste

Handlebars = require("handlebars")

const symFilePath = process.argv[1]
const scriptName = /[^/]*$/.exec(symFilePath)[0]
env.SIMPLE_SRC_PATH = path.join(env.SIMPLE_PATH, "src")
env.SIMPLE_BIN_PATH = path.join(env.SIMPLE_PATH, "bin")
env.SIMPLE_ENV_FILE = path.join(env.SIMPLE_PATH, ".env")
env.SIMPLE_BIN_TEMPLATE_PATH = path.join(
  env.SIMPLE_PATH,
  "config",
  "template-bin"
)

warn = message => {
  console.log(chalk.red(message))
}

const createBinFilePath = name =>
  path.join(env.SIMPLE_BIN_PATH, name)

const createSourceFilePath = name =>
  path.join(env.SIMPLE_SRC_PATH, name + ".js")

launchEditor = async (file, dir, line = 0, col = 0) => {
  if (env.SIMPLE_EDITOR == "code") {
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
    if (env.SIMPLE_EDITOR.includes("vi"))
      editorArgs.push(">/dev/tty")
    let child = spawn(env.SIMPLE_EDITOR, editorArgs, {
      stdio: "inherit",
    })

    child.on("exit", function (e, code) {
      // console.log(env.SIMPLE_EDITOR, " opened: ", file)
    })
  }
  echo(
    `Opening ${chalk.yellow(file)} with ${
      env.SIMPLE_EDITOR
    }`
  )
  tutorialCheck()
}

applescript = script =>
  exec(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`)

say = string => {
  applescript(`say "${string}" speaking rate 250`)
}

notify = (title, subtitle) => {
  applescript(
    `display notification with title "${title}" subtitle "${subtitle}"`
  )
}

preview = file => {
  exec(`qlmanage -p "${file}"`, { silent: true })
}

const updateEnvKey = (envKey, envValue) => {
  let regex = new RegExp("^" + envKey + "=.*$")
  sed(
    "-i",
    regex,
    envKey + "=" + envValue,
    env.SIMPLE_ENV_FILE
  )
}

const writeNewEnvKey = envKeyValue => {
  new ShellString("\n" + envKeyValue).toEnd(
    env.SIMPLE_ENV_FILE
  )
}

renameScript = async (oldName, newName) => {
  const oldSourcePath = createSourceFilePath(oldName)
  const oldBinPath = createBinFilePath(oldName)
  const newSourcePath = createSourceFilePath(newName)
  rm(oldBinPath)
  mv(oldSourcePath, newSourcePath)
  createBinFile(newName)
  if (oldName == env.SIMPLE_NAME) {
    updateEnvKey("SIMPLE_NAME", newName)
  }
}

const createBinFile = async name => {
  let binTemplate = await readFile(
    env.SIMPLE_BIN_TEMPLATE_PATH,
    "utf8"
  )
  binTemplate = Handlebars.compile(binTemplate)
  binTemplate = binTemplate({ name })

  let binFilePath = createBinFilePath(name)
  await writeFile(binFilePath, binTemplate)
  chmod(755, binFilePath)
}

copyScript = async (source, target) => {
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
    env.SIMPLE_SRC_PATH,
    target + ".js"
  )

  const sourceFilePath = createSourceFilePath(source)
  cp(sourceFilePath, newSrcFilePath)
  await createBinFile(target)

  launchEditor(newSrcFilePath, env.SIMPLE_PATH)
}

removeScript = async name => {
  rm(createBinFilePath(name))
  rm(createSourceFilePath(name))
  echo(`Removed script: ` + chalk.green.bold(name))
}

createScript = async name => {
  let template = env.SIMPLE_TEMPLATE
  let result = exec(`type ${name}`, { silent: true })
  if (result.stdout) {
    console.log(`${name} already exists. 
${result.stdout.trim()}
Aborting...`)
    exit()
  }

  let simpleTemplatePath = path.join(
    env.SIMPLE_PATH,
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

  let greenName = chalk.green(name)
  let yellowTemplate = chalk.yellow(template)

  echo(
    `Created a ${greenName} script using the ${yellowTemplate} template.`
  )

  let line = 0
  let col = 0
  if (template == "default") {
    line = 2
    col = 17
  }

  launchEditor(simpleFilePath, env.SIMPLE_PATH, line, col)
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
assignPropsTo(args, arg)

const untildify = require("untildify")

env = async (envKey, promptConfig = {}) => {
  if (env[envKey]) return untildify(env[envKey])
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

  let input = await prompt({
    ...promptConfigDefaults,
    ...promptConfig,
  })

  let regex = new RegExp("^" + envKey + "=.*$")
  let { stdout } = grep(regex, env.SIMPLE_ENV_FILE)

  let envKeyValue = envKey + "=" + input.value

  if (stdout == "\n") {
    writeNewEnvKey(envKeyValue)
  } else {
    updateEnvKey(envKey, input.value)
  }

  let value = untildify(input.value)
  env[envKey] = value
  return value
}

assignPropsTo(process.env, env)

getScripts = async () => {
  let result = ls("-l", path.join(env.SIMPLE_PATH, "bin"))
  return result.map(file => file)
}
