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
const jsSrcPath = path.join(env.JS_PATH, "src")
const jsBinPath = path.join(env.JS_PATH, "bin")
const envFile = path.join(env.JS_PATH, ".env")

info = message => {
  console.log(chalk.yellow(message))
}

warn = message => {
  console.log(chalk.red(message))
}

const createSymFilePath = name => path.join(jsBinPath, name)

const createSourceFilePath = name =>
  path.join(jsSrcPath, name + ".mjs")

editor = async (file, dir, line = 0) => {
  if (env.JS_EDITOR == "code") {
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
    if (env.JS_EDITOR.includes("vi"))
      editorArgs.push(">/dev/tty")
    let child = spawn(env.JS_EDITOR, editorArgs, {
      stdio: "inherit",
    })

    child.on("exit", function (e, code) {
      // console.log(env.JS_EDITOR, " opened: ", file)
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

renameScript = async (oldName, newName) => {
  const oldPath = createSourceFilePath(oldName)
  const oldSym = createSymFilePath(oldName)
  const newPath = createSourceFilePath(newName)
  const newSym = createSymFilePath(newName)
  rm(oldSym)
  mv(oldPath, newPath)
  ln("-s", newPath, newSym)
  exit()
}

copyScript = async (source, target) => {
  //usage: my-script --cp new-script
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
    jsSrcPath,
    target + ".mjs"
  )

  const sourceFilePath = createSourceFilePath(source)
  cp(sourceFilePath, newSrcFilePath)
  ln("-s", newSrcFilePath, path.join(jsBinPath, target))
  editor(newSrcFilePath, env.JS_PATH)
}

removeScript = async name => {
  rm(createSymFilePath(name))
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

  let jsTemplatePath = path.join(
    env.JS_PATH,
    "templates",
    (await env("TEMPLATE")) + ".mjs"
  )

  let binTemplatePath = path.join(
    env.JS_PATH,
    "config",
    "template-bin"
  )

  let jsTemplate = await readFile(jsTemplatePath, "utf8")
  jsTemplate = Handlebars.compile(jsTemplate)
  jsTemplate = jsTemplate({
    ...env,
    name,
  })

  let binTemplate = await readFile(binTemplatePath, "utf8")
  binTemplate = Handlebars.compile(binTemplate)
  binTemplate = binTemplate({ name })

  let binFilePath = createSymFilePath(name)
  let jsFilePath = createSourceFilePath(name)

  await writeFile(jsFilePath, jsTemplate)
  await writeFile(binFilePath, binTemplate)
  chmod(755, binFilePath)

  editor(jsFilePath, env.JS_PATH)
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
  let { stdout } = grep(regex, envFile)

  let envVar = envKey + "=" + input.value

  if (stdout == "\n") {
    new ShellString("\n" + envVar).toEnd(envFile)
  } else {
    sed("-i", regex, envVar, envFile)
  }

  let value = untildify(input.value)
  env[envKey] = value
  return value
}

assignPropsTo(process.env, env)

getScripts = async () => {
  let result = ls("-l", path.join(env.JS_PATH, "bin"))
  return result.map(file => file)
}
