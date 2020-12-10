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
prompt = inquirer.prompt
Separator = inquirer.Separator
chalk = require("chalk")

axios = require("axios")
get = axios.get
post = axios.post
put = axios.put
patch = axios.patch

const fsPromises = require("fs/promises")

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
  if (!which(await env("EDITOR"))) {
    console.log(
      chalk.red(
        `Couldn't find the editor: ${await env("EDITOR")}`
      )
    )
    return
  }

  if ((await env("EDITOR")) == "code") {
    let codeArgs = ["--goto", `${file}:${line}`]
    if (dir) codeArgs.push("--folder-uri", dir)
    let child = spawn("code", codeArgs, {
      stdio: "inherit",
    })

    child.on("exit", function (e, code) {
      // console.log("code launched: ", file)
    })
  } else {
    let child = spawn(env.EDITOR, [file], {
      stdio: "inherit",
    })

    child.on("exit", function (e, code) {
      // console.log(env.EDITOR, " opened: ", file)
    })
  }

  exec(env.EDITOR + " " + file)
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

if (args.help) {
  console.log(
    `
Options:    
--edit opens the script in your editor: joke --edit
--cp duplicates the script: joke --cp dadjoke
--mv renames the script: joke --mv dadjoke
--rm removes the script: joke --rm
  `.trim()
  )
}

if (args.edit) {
  //usage: my-script --edit
  editor(createSourceFilePath(scriptName), env.JS_PATH)
  exit()
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

if (args.mv) {
  //usage: my-script --mv renamed-script
  renameScript(scriptName, args.mv)
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
  exit()
}

if (args.cp) {
  copyScript(scriptName, args.cp)
}

removeScript = async name => {
  rm(createSymFilePath(name))
  rm(createSourceFilePath(name))
  info(`Removed script: ${name}`)
  exit()
}

if (args.rm) {
  removeScript(scriptName)
  //usage: my-script --rm
}

if (args.ln) {
  //usage: my-script.mjs --ln
  const filePath = symFilePath
  ln(
    "-s",
    filePath,
    path.join(jsBinPath, scriptName.slice(0, -4))
  )
  exit()
}

createScript = async name => {
  let result = exec(`type ${name}`, { silent: true })
  if (result.stdout) {
    console.log(`${name} already exists. 
${result.stdout.trim()}
Aborting...`)
    exit()
  }

  let templatePath = path.join(
    await env("JS_PATH"),
    "templates",
    (await env("TEMPLATE")) + ".mjs"
  )

  let template = await readFile(templatePath, "utf8")
  template = Handlebars.compile(template)
  template = template({
    ...env,
    name,
  })

  if (args.paste) {
    template = paste()
  }

  let symFilePath = createSymFilePath(name)
  let filePath = createSourceFilePath(name)

  writeFile(filePath, template)
  chmod(755, filePath)

  ln("-s", filePath, symFilePath)

  editor(filePath, env.JS_PATH, 3)
}

nextTime = command => {
  console.log(
    chalk.yellow.italic(`Next time try:`),
    chalk.green.bold(command)
  )
}

let promptedArgs = ""
promptForArg = async (message, choices) => {
  let input
  if (!choices) {
    input = await prompt({ name: "name", message })
  } else {
    input = await prompt({
      name: "name",
      message,
      type: "search-list",
      choices,
    })
  }

  promptedArgs += " " + input.name
  nextTime(scriptName + promptedArgs)

  return input.name
}

arg = async (index, message = "Input: ", choices) => {
  return (
    args[index] || (await promptForArg(message, choices))
  )
}
assignPropsTo(args, arg)

promptForEnv = async name => {
  let envFile = path.join(env.JS_PATH, ".env")

  let input = await prompt({
    name: "value",
    message: `Set ${name} to:`,
  })

  let regex = new RegExp("^" + name + "=.*$")
  let { stdout } = grep(regex, envFile)

  let envVar = name + "=" + input.value

  if (stdout == "\n") {
    echo("-n", "\n" + envVar).toEnd(envFile)
  } else {
    sed("-i", regex, envVar, envFile)
  }

  return input.value
}

env = async name => {
  return process.env[name] || (await promptForEnv(name))
}

assignPropsTo(process.env, env)

getScripts = async () => {
  return (
    await readdir(path.join(env.JS_PATH, "bin"), {
      encoding: "utf8",
      withFileTypes: true,
    })
  ).filter(file => file.isSymbolicLink())
}
