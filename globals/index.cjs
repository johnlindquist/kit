//cjs is required to load/assign the content of this script synchronously
//we may be able to convert this to .mjs if an "--import" flag is added
//https://github.com/nodejs/node/issues/35103

function assignPropsTo(source, target) {
  Object.entries(source).forEach(([key, value]) => {
    target[key] = value
  })
}

assignPropsTo(process.env, global)
assignPropsTo(require("shelljs"), global)
global.args = process.argv.slice(2)
//map args to $1, $2, etc
args.forEach((arg, index) => {
  global["$" + String(index + 1)] = arg
})
//map named args to global args. e.g. --foo is mapped to args.foo
const yargs = require("yargs/yargs")
const { hideBin } = require("yargs/helpers")
assignPropsTo(
  yargs(hideBin(process.argv)).help(false).argv,
  args
)

global.path = require("path")
global.jq = require("node-jq")
global.prompt = require("inquirer").prompt
global.chalk = require("chalk")

global.axios = require("axios")
global.get = axios.get
global.post = axios.post
global.put = axios.put
global.patch = axios.patch

const fsPromises = require("fs/promises")

global.readFile = fsPromises.readFile
global.writeFile = fsPromises.writeFile
global.readdir = fsPromises.readdir

const copyPaste = require("copy-paste")
global.copy = copyPaste.copy
global.paste = copyPaste.paste

global.TMP_DIR = require("os").tmpdir()

const symFilePath = process.argv[1]
const name = /[^/]*$/.exec(symFilePath)[0]
const fileName = `${name}.mjs`
const jsSrcPath = path.join(JS_PATH, "src")
const jsBinPath = path.join(JS_PATH, "bin")

const createSymFilePath = name => path.join(jsBinPath, name)

const createSourceFilePath = name =>
  path.join(jsSrcPath, name + ".mjs")

global.commandExists = command => {
  return exec(`type ${command}`, {
    silent: true,
  }).stdout.trim()
}

global.code = (file, dir, line = 0) => {
  if (!commandExists(EDITOR)) {
    console.log(
      chalk.red(`Couldn't find a configured editor`)
    )
    return
  }
  if (EDITOR == "code") {
    exec(
      `code --goto ${file}:${line} ${
        dir && `--folder-uri ${dir}`
      }`
    )
  }

  exec(EDITOR + " " + file)
}

global.applescript = script =>
  exec(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`)

global.say = string => {
  applescript(`say "${string}" speaking rate 250`)
}

global.notify = (title, subtitle) => {
  applescript(
    `display notification with title "${title}" subtitle "${subtitle}"`
  )
}

global.preview = file => {
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
  code(createSourceFilePath(name), JS_PATH)
  exit()
}

global.renameScript = async (oldName, newName) => {
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
  renameScript(name, args.mv)
}

global.copyScript = async (source, target) => {
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
  code(newSrcFilePath, JS_PATH)
  exit()
}

if (args.cp) {
  copyScript(name, args.cp)
}

global.removeScript = async name => {
  rm(createSymFilePath(name))
  rm(createSourceFilePath(name))
  exit()
}

if (args.rm) {
  removeScript(name)
  //usage: my-script --rm
}

if (args.ln) {
  //usage: my-script.mjs --ln
  const filePath = symFilePath
  ln(
    "-s",
    filePath,
    path.join(jsBinPath, name.slice(0, -4))
  )
  exit()
}

global.createScript = async name => {
  let result = exec(`type ${name}`, { silent: true })
  if (result.stdout) {
    console.log(`${name} already exists. 
${result.stdout.trim()}
Aborting...`)
    exit()
  }

  let template = `#!js

`

  if (args.paste) {
    template = paste()
  }

  let symFilePath = createSymFilePath(name)
  let filePath = createSourceFilePath(name)

  await writeFile(filePath, template)
  chmod(755, filePath)

  ln("-s", filePath, symFilePath)

  code(filePath, JS_PATH, 3)
}
