#!/usr/bin/env js

const edit = async file => {
  nextTime(file + " --edit")
  const fileName = file + ".mjs"
  editor(path.join(env.JS_PATH, "src", fileName))
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
  editor(
    path.join(env.JS_PATH, "src", newFile.name + ".mjs")
  )
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

const spawnScript = command => async () => {
  let child = child_process.spawn(
    env.JS_PATH + "/config/" + command + ".sh",
    [],
    {
      stdio: "inherit",
    }
  )

  child.on("exit", function (e, code) {
    console.log(command + " complete")
  })
}

const emph = chalk.green.bold

const actionMap = {
  ["new"]: {
    message: "Create a new script",
    action: createFile(),
  },
  ["run"]: {
    message: "Run a script",
    action: selectFile(run()),
  },
  ["edit"]: {
    message: "Edit a script",
    action: selectFile(edit),
  },
  ["ls"]: {
    message: "List all scripts",
    action: async () => {
      let scripts = (await getScripts()).map(
        file => file.name
      )
      echo(scripts)
      if (!arg[0]) nextTime(`js ls`)
    },
  },
  ["cp"]: {
    message: "Duplicate a script",
    action: selectFile(cp),
  },
  ["mv"]: {
    message: "Rename a script",
    action: selectFile(mv),
  },
  ["rm"]: {
    message: "Remove a script",
    action: selectFile(rm),
  },
  ["i"]: {
    message: "Install an npm package",
    action: npmCommand("install"),
  },
  ["un"]: {
    message: "Uninstall an npm package",
    action: npmCommand("uninstall"),
  },
  ["env"]: {
    message: "Modify .env",
    action: () => {
      editor(path.join(env.JS_PATH, ".env"))
      if (!arg[0]) nextTime(`js env`)
    },
  },
  ["issue"]: {
    message: "File an issue on github",
    action: run("issue"),
  },
  ["update"]: {
    message: "Update js",
    action: spawnScript("update"),
  },
  ["quit"]: {
    message: "Quit js",
    action: () => {
      exit()
    },
  },
}

const triggerAction = async action => {
  await actionMap[action].action(action)
}

const action = arg[0]

if (action == "help" || !action) {
  const help = await prompt({
    type: "search-list",
    name: "arg",
    loop: false,
    message: "What do you want to do?",
    choices: [
      ...Object.entries(actionMap).map(([key, value]) => ({
        name: emph(key) + ": " + value.message,
        value: key,
      })),
    ],
  })

  triggerAction(help.arg)
}
if (action) {
  if (actionMap[action]) {
    triggerAction(action)
  } else {
    warn(action + " is not a valid argument")
  }
}
