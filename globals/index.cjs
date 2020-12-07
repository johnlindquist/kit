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
const srcFilePath = path.join(jsSrcPath, fileName)

global.commandExists = command => {
  return exec(`type ${command}`, {
    silent: true,
  }).stdout.trim()
}

global.code = (file, dir, line = 0) => {
  if (!commandExists("code")) {
    console.log(`Couldn't find a configured editor`)
    return
  }
  exec(
    `code --goto ${file}:${line} ${
      dir && `--folder-uri ${dir}`
    }`
  )
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
  exit()
}

if (args.edit) {
  //usage: my-script --edit
  code(srcFilePath, JS_PATH)
  exit()
}

if (args.mv) {
  //usage: my-script --mv renamed-script
  const newSrcFilePath = path.join(
    jsSrcPath,
    args.mv + ".mjs"
  )
  rm(symFilePath)
  mv(srcFilePath, newSrcFilePath)
  ln("-s", newSrcFilePath, path.join(jsBinPath, args.mv))
  exit()
}

if (args.cp) {
  //usage: my-script --cp new-script
  let result = exec(`type ${args.cp}`, { silent: true })
  if (result.stdout) {
    console.log(`${args.cp} already exists. 
${result.stdout.trim()}
Aborting...`)
    exit()
  }
  const newSrcFilePath = path.join(
    jsSrcPath,
    args.cp + ".mjs"
  )
  cp(srcFilePath, newSrcFilePath)
  ln("-s", newSrcFilePath, path.join(jsBinPath, args.cp))
  code(newSrcFilePath, JS_PATH)
  exit()
}

if (args.rm) {
  //usage: my-script --rm
  rm(symFilePath)
  rm(srcFilePath)
  exit()
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
