#!js

const edit = async file => {
  nextTime(file + " --edit")
  const fileName = file + ".mjs"
  code(path.join(JS_PATH, "src", fileName))
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
  code(path.join(JS_PATH, "src", newFile.name + ".mjs"))
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

const run = async file => {
  import("./" + file + ".mjs")
  nextTime(file)
}

const selectFile = action => async name => {
  const fileSelect = await prompt({
    type: "list",
    name: "file",
    loop: false,
    message: `Which script do you want to ${name}`,
    choices: (
      await readdir(path.join(JS_PATH, "bin"))
    ).filter(file => !file.startsWith(".")),
  })

  await action(fileSelect.file)
}

const listScripts = () => async () => {
  console.log(
    (await readdir(path.join(JS_PATH, "bin"))).filter(
      file => !file.startsWith(".")
    )
  )

  nextTime(`js ls`)
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

  exec(JS_NPM + " " + command + " " + npmPackage.name)

  const shortcut = {
    install: "i",
    uninstall: "un",
  }

  nextTime(
    "js " + shortcut[command] + " " + npmPackage.name
  )
}

const actionMap = {
  run: selectFile(run),
  ls: listScripts(),
  new: createFile(),
  edit: selectFile(edit),
  duplicate: selectFile(cp),
  delete: selectFile(rm),
  rename: selectFile(mv),
  install: npmCommand("install"),
  uninstall: npmCommand("uninstall"),
}

const help = await prompt({
  type: "list",
  name: "action",
  loop: false,
  message: "What do you want to do with a script?",
  choices: Object.keys(actionMap),
})

const result = await actionMap[help.action](help.action)
