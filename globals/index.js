//map args to $1, $2, etc
global.args = process.argv.slice(2)

args.forEach((arg, index) => {
  global["$" + String(index + 1)] = arg
})

const fsPromises = require("fs/promises")
const child_process = require("child_process")

global.shell = require("shelljs")

global.readFile = fsPromises.readFile
global.writeFile = fsPromises.writeFile
global.readdir = fsPromises.readdir
global.access = fsPromises.access
global.chmod = fsPromises.chmod

global.exec = child_process.exec
global.execSync = child_process.execSync
global.spawn = child_process.spawn

global.path = require("path")
global.fetch = require("node-fetch")
global.axios = require("axios")
global.jq = require("node-jq")
global.titleCase = require("title-case").titleCase
global.paramCase = require("param-case").paramCase

global.applescript = script =>
  execSync(
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
  exec(`qlmanage -p "${file}"`)
}

global.openInCode = (file, dir, line) => {
  exec(`code --folder-uri ${dir} --goto ${file}:${line}`)
}

JSON.log = async (object, selector = ".") => {
  let out = await jq.run(selector, object, {
    input: "json",
    output: "json",
  })

  console.log(out)
}
