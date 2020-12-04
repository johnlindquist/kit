//cjs is required to load/assign the content of this script synchronously
//we may be able to convert this to .mjs if an "--import" flag is added
//https://github.com/nodejs/node/issues/35103

global.path = require("path")
global.shell = require("shelljs")
global.axios = require("axios")
global.jq = require("node-jq")

const yargs = require("yargs/yargs")
const { hideBin } = require("yargs/helpers")
const { edit, mv, rm, cp, ln } = yargs(
  hideBin(process.argv)
).argv
const node = process.argv[0]
const symFilePath = process.argv[1]
global.args = process.argv.slice(2)
global.JS_PATH = process.env.JS_PATH

//map args to $1, $2, etc
args.forEach((arg, index) => {
  global["$" + String(index + 1)] = arg
})

global.code = (file, dir, line = 0) => {
  shell.exec(
    `code --goto ${file}:${line} ${
      dir && `--folder-uri ${dir}`
    }`
  )
}

const name = /[^/]*$/.exec(symFilePath)[0]
const fileName = `${name}.mjs`
const jsSrcPath = path.join(JS_PATH, "src")
const jsBinPath = path.join(JS_PATH, "bin")
const srcFilePath = path.join(jsSrcPath, fileName)

if (edit) {
  //usage: my-script --edit
  code(srcFilePath, JS_PATH)
  shell.exit()
}

if (mv) {
  //usage: my-script --mv renamed-script
  const newSrcFilePath = path.join(jsSrcPath, mv + ".mjs")
  shell.rm(symFilePath)
  shell.mv(srcFilePath, newSrcFilePath)
  shell.ln("-s", newSrcFilePath, path.join(jsBinPath, mv))
  shell.exit()
}

if (cp) {
  //usage: my-script --cp new-script
  const newSrcFilePath = path.join(jsSrcPath, cp + ".mjs")
  shell.cp(srcFilePath, newSrcFilePath)
  shell.ln("-s", newSrcFilePath, path.join(jsBinPath, cp))
  code(newSrcFilePath, JS_PATH)
  shell.exit()
}

if (rm) {
  //usage: my-script --rm
  shell.rm(symFilePath)
  shell.rm(srcFilePath)
  shell.exit()
}

if (ln) {
  //usage: my-script.mjs --ln
  const filePath = symFilePath
  shell.ln(
    "-s",
    filePath,
    path.join(jsBinPath, name.slice(0, -4))
  )
  shell.exit()
}

const fsPromises = require("fs/promises")

global.readFile = fsPromises.readFile
global.writeFile = fsPromises.writeFile
global.readdir = fsPromises.readdir

global.applescript = script =>
  shell.exec(
    `osascript -e '${script.replace(/'/g, "'\"'\"'")}'`
  )

global.say = string => {
  applescript(`say "${string}" speaking rate 250`)
}

global.notify = (title, subtitle) => {
  applescript(
    `display notification with title "${title}" subtitle "${subtitle}"`
  )
}

global.preview = file => {
  shell.exec(`qlmanage -p "${file}"`, { silent: true })
}

JSON.log = async (object, selector = ".") => {
  let out = await jq.run(selector, object, {
    input: "json",
    output: "json",
  })

  console.log(out)
}
