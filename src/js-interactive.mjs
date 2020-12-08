#!/usr/bin/env js

const edit = async file => {
  nextTime(file + " --edit")
  const fileName = file + ".mjs"
  code(path.join(env.JS_PATH, "src", fileName))
}

const rm = async file => {
  nextTime(file + " --rm")
  removeScript(file)
}

const cp = async file => {
  const newFile = await prompt({
    type: "input",
    name: "name",
    message: "Name the new duplicated script:",
  })
  nextTime(file + " --cp " + newFile.name)

  copyScript(file, newFile.name)
  code(path.join(env.JS_PATH, "src", newFile.name + ".mjs"))
}
const mv = async file => {
  const newFile = await prompt({
    type: "input",
    name: "name",
    message: "Rename script to:",
  })
  nextTime(file + " --mv " + newFile.name)

  renameScript(file, newFile.name)
}

const run = file => async selectedFile => {
  const f = file || selectedFile
  import("./" + f + ".mjs")
  nextTime(f)
}

const selectFile = action => async name => {
  const fileSelect = await prompt({
    type: "search-list",
    name: "file",
    loop: false,
    message: `Which script do you want to ${name}`,
    choices: await getScripts(),
  })

  await action(fileSelect.file)
}

const createFile = () => async () => {
  const newFile = await prompt({
    type: "input",
    name: "name",
    message: "Name the new script:",
  })
  nextTime("new " + newFile.name)

  createScript(newFile.name)
}

const npmCommand = command => async () => {
  const npmPackage = await prompt({
    type: "input",
    name: "name",
    message: "Which npm package do you want to command?",
  })

  exec(env.JS_NPM + " " + command + " " + npmPackage.name)

  const shortcut = {
    install: "i",
    uninstall: "un",
  }

  nextTime(
    "js " + shortcut[command] + " " + npmPackage.name
  )
}

const jsCommand = command => async () => {
  let jsCommand = `js ` + command
  exec(jsCommand)
  nextTime(jsCommand)
}

const emph = chalk.green.bold

let newScript = emph("new") + ": Create a new script"
let runScript = emph("run") + ": Run a script"
let editScript = emph("edit") + ": Edit a script"
let lsScript = emph("ls") + ": List all scripts"
let cpScript = emph("cp") + ": Duplicate a script"
let mvScript = emph("mv") + ": Rename a script"
let rmScript = emph("rm") + ": Remove a script"
let iPackage = emph("i") + ": Install an npm package"
let unPackage = emph("un") + ": Uninstall an npm package"
let editEnv = emph("env") + ": Modify settings in .env"
let fileIssue = emph("issue") + ": File an issue on github"

const actionMap = {
  [newScript]: createFile(),
  [runScript]: selectFile(run()),
  [editScript]: selectFile(edit),
  [lsScript]: jsCommand("ls"),
  [cpScript]: selectFile(cp),
  [mvScript]: selectFile(mv),
  [rmScript]: selectFile(rm),
  [iPackage]: npmCommand("install"),
  [unPackage]: npmCommand("uninstall"),
  [editEnv]: jsCommand("env"),
  [fileIssue]: run("issue"),
}

const help = await prompt({
  type: "search-list",
  name: "action",
  loop: false,
  message: "What do you want to do?",
  choices: [...Object.keys(actionMap)],
})

const result = await actionMap[help.action](help.action)
