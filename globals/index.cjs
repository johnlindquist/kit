//cjs is required to load/assign the content of this script synchronously
//we may be able to convert this to .mjs if an "--import" flag is added
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
  "search-list",
  require("inquirer-search-list")
)

inquirer.registerPrompt(
  "suggest",
  require("inquirer-prompt-suggest")
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
writeFile = fsPromises.writeFile
readdir = fsPromises.readdir

const copyPaste = require("copy-paste")
copy = copyPaste.copy
paste = copyPaste.paste

Handlebars = require("handlebars")

const symFilePath = process.argv[1]
const scriptName = /[^/]*$/.exec(symFilePath)[0]
const SRC_PATH = path.join(env.SIMPLE_PATH, "src")
const BIN_PATH = path.join(env.SIMPLE_PATH, "bin")
const ENV_FILE = path.join(env.SIMPLE_PATH, ".env")
const BIN_TEMPLATE_PATH = path.join(
  env.SIMPLE_PATH,
  "config",
  "template-bin"
)

info = message => {
  console.log(chalk.yellow(message))
}

warn = message => {
  console.log(chalk.red(message))
}

const createBinFilePath = name => path.join(BIN_PATH, name)

const createSourceFilePath = name =>
  path.join(SRC_PATH, name + ".mjs")

editor = async (file, dir, line = 0) => {
  if (env.SIMPLE_EDITOR == "code") {
    let codeArgs = ["--goto", `${file}:${line}`]
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
  sed("-i", regex, envKey + "=" + envValue, ENV_FILE)
}

const writeNewEnvKey = envKeyValue => {
  new ShellString("\n" + envKeyValue).toEnd(ENV_FILE)
}

renameScript = async (oldName, newName) => {
  const oldSourcePath = createSourceFilePath(oldName)
  const oldBinPath = createBinFilePath(oldName)
  const newSourcePath = createSourceFilePath(newName)
  rm(oldBinPath)
  mv(oldSourcePath, newSourcePath)
  createBinFile(newName)
  if (oldName == env.SIMPLE_MAIN) {
    updateEnvKey("SIMPLE_MAIN", newName)
  }
}

const createBinFile = async name => {
  let binTemplate = await readFile(
    BIN_TEMPLATE_PATH,
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
    SRC_PATH,
    target + ".mjs"
  )

  const sourceFilePath = createSourceFilePath(source)
  cp(sourceFilePath, newSrcFilePath)
  await createBinFile(target)

  editor(newSrcFilePath, env.SIMPLE_PATH)
}

removeScript = async name => {
  rm(createBinFilePath(name))
  rm(createSourceFilePath(name))
  info(`Removed script: ${name}`)
}

createScript = async name => {
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
    (await env("SIMPLE_TEMPLATE")) + ".mjs"
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

  editor(simpleFilePath, env.SIMPLE_PATH)
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
  let type = promptConfig.choices ? "search-list" : "input"
  promptConfig = {
    message,
    type,
    name: "name",
    ...promptConfig,
  }

  return (
    arg[key] ||
    (await prompt(promptConfig))[promptConfig["name"]]
  )
}
assignPropsTo(args, arg)

const untildify = require("untildify")

env = async (envKey, promptConfig = {}) => {
  if (env[envKey]) return untildify(env[envKey])
  let promptConfigDefaults = {
    name: "value",
    message: `Set ${envKey} env to:`,
  }

  let input = await prompt({
    ...promptConfigDefaults,
    ...promptConfig,
    type: promptConfig.choices ? "list" : "input",
  })

  let regex = new RegExp("^" + envKey + "=.*$")
  let { stdout } = grep(regex, ENV_FILE)

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
