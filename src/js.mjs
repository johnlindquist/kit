/**
 * Description: The js interface
 */

const action = arg[0]
const sourceArg = arg[1]
const targetArg = arg[2]

const emph = chalk.green.bold

const edit = async (file, prompted) => {
  const fileName = file + ".mjs"
  editor(path.join(env.JS_PATH, "src", fileName))
  if (prompted) nextTime("edit " + file)
}

const rm = async file => {
  const confirm = await prompt({
    type: "confirm",
    name: "value",
    message:
      `Are you sure you want to delete: ` +
      emph(file) +
      "?",
  })

  if (confirm.value) {
    removeScript(file)
  } else {
    echo(`Skipping ` + file)
  }
}

const cp = async file => {
  if (targetArg) {
    copyScript(file, targetArg)
    return
  }
  const newFile = await prompt({
    type: "input",
    name: "name",
    message: "Name the new duplicated script:",
  })
  nextTime("js cp " + file + " " + newFile.name)

  copyScript(file, newFile.name)
}
const mv = async file => {
  if (targetArg) {
    renameScript(file, targetArg)
    return
  }
  const newFile = await prompt({
    type: "input",
    name: "name",
    message: "Rename script to:",
  })
  nextTime("js mv " + file + " " + newFile.name)

  renameScript(file, newFile.name)
}

const run = file => async selectedFile => {
  const f = file || selectedFile
  import("./" + f + ".mjs")
  nextTime(f)
}

const selectFile = action => async name => {
  if (sourceArg) {
    await action(sourceArg)
    return
  }

  let scripts = (await getScripts()).map(file => file.name)

  let choices = scripts.map(name => {
    let word = "Description: "
    let { stdout } = grep(
      word,
      path.join(env.JS_PATH, "src", name + ".mjs")
    )

    let description = stdout
      .substring(0, stdout.indexOf("\n"))
      .substring(stdout.indexOf(word) + word.length)
      .trim()

    return {
      name: description ? name + ": " + description : name,
      value: name,
    }
  })

  const fileSelect = await prompt({
    type: "search-list",
    name: "file",
    loop: false,
    message: `Which script do you want to ${name}`,
    choices,
  })

  await action(fileSelect.file, "prompted")
}

const checkboxFile = action => async name => {
  if (sourceArg) {
    await action(sourceArg)
    return
  }

  let scripts = (await getScripts()).map(file => file.name)

  let choices = scripts.map(name => {
    let word = "Description: "
    let { stdout } = grep(
      word,
      path.join(env.JS_PATH, "src", name + ".mjs")
    )

    let description = stdout
      .substring(0, stdout.indexOf("\n"))
      .substring(stdout.indexOf(word) + word.length)
      .trim()

    return {
      name: description ? name + ": " + description : name,
      value: name,
    }
  })

  const fileSelect = await prompt({
    type: "checkbox",
    name: "scripts",
    loop: false,
    message: `Which scripts do you want to ${name}`,
    choices,
  })

  for await (let script of fileSelect.scripts) {
    await action(script)
  }
}

const createFile = () => async () => {
  if (sourceArg) {
    await createScript(sourceArg)
    return
  }
  const newFile = await prompt({
    type: "input",
    name: "name",
    message: "Name the new script:",
  })
  nextTime("new " + newFile.name)

  createScript(newFile.name)
}

const npmCommand = command => async () => {
  if (sourceArg) {
    exec(env.JS_NPM + " " + command + " " + sourceArg)
  } else {
    const npmPackage = await prompt({
      type: "input",
      name: "name",
      message: `Which npm package do you want to ${command}?`,
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

const actionMap = {
  ["new"]: {
    message: "Create a new script",
    action: run("new"),
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
      if (!action) nextTime(`js ls`)
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
    action: checkboxFile(rm),
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
      if (!action) nextTime(`js env`)
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

if (action == "help" || !action) {
  const help = await prompt({
    type: "search-list",
    name: "arg",
    loop: false,
    message:
      (await env("TEMPLATE")) == "tutorial"
        ? "Start by creating a new script:"
        : "What do you want to do?",
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
