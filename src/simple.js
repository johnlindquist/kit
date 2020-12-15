/**
 * Description: The simple interface
 */

const action = arg[0]
const sourceArg = arg[1]
const targetArg = arg[2]

const emph = chalk.green.bold

const rm = async filePattern => {
  let { removeScript } = await import(
    "./simple/removeScript.js"
  )
  let files = ls(env.SIMPLE_BIN_PATH)
    .toString()
    .split(",")
    .filter(name => name.match(filePattern))

  for await (let file of files) {
    if (file == env.SIMPLE_NAME) {
      echo(
        `Sorry, you can't rm the MAIN script, but you can rename it:`
      )
      await mv(file)
      return
    }
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
}

const cp = async file => {
  let { copyScript } = await import(
    "./simple/copyScript.js"
  )
  if (targetArg) {
    copyScript(file, targetArg)
    return
  }
  const newFile = await prompt({
    type: "input",
    name: "name",
    message: "Name the new duplicated script:",
  })
  nextTime(
    `${env.SIMPLE_NAME} cp ` + file + " " + newFile.name
  )

  copyScript(file, newFile.name)
}
const mv = async file => {
  let { renameScript } = await import(
    "./simple/renameScript.js"
  )
  if (targetArg) {
    renameScript(file, targetArg)
    return
  }
  const newFile = await prompt({
    type: "input",
    name: "name",
    message: "Rename script to:",
  })
  nextTime(
    `${env.SIMPLE_NAME} mv ` + file + " " + newFile.name
  )

  renameScript(file, newFile.name)
}

const run = file => async selectedFile => {
  const f = file || selectedFile
  if (f == "new" && env.SIMPLE_TEMPLATE == "tutorial") {
    spawn("tutorial", [], { stdio: "inherit" })
  } else {
    if (env.SIMPLE_TEMPLATE == "default") {
      echo(
        `Note: simple displays the text following the "Description" comment when listing scripts`
      )
    }
    spawn(f, [...args], { stdio: "inherit" })
  }
  nextTime(f)
}

const selectFile = action => async name => {
  if (sourceArg) {
    await action(sourceArg)
    return
  }

  const fileSelect = await prompt({
    type: "search-list",
    name: "file",
    loop: false,
    message: `Which script do you want to ${name}`,
    choices: await (
      await import("./simple/getScriptsInfo.js")
    ).getScriptsInfo(),
  })

  await action(fileSelect.file, "prompted")
}

const checkboxFile = action => async name => {
  if (sourceArg) {
    await action(sourceArg)
    return
  }

  const fileSelect = await prompt({
    type: "checkbox",
    name: "scripts",
    loop: false,
    message: `Which scripts do you want to ${name}`,
    choices: await (
      await import("./simple/getScriptsInfo.js")
    ).getScriptsInfo(),
  })

  for await (let script of fileSelect.scripts) {
    await action(script)
  }
}

const npmCommand = command => async () => {
  cd(env.SIMPLE_PATH)
  const options = {
    stdio: "inherit",
    env: {
      ...env,
      PATH: env.SIMPLE_NODE_PATH + ":" + env.PATH,
    },
  }
  if (sourceArg) {
    spawn(
      env.SIMPLE_NPM,
      [command, ...args.slice(1)],
      options
    )
  } else {
    const npmPackage = await prompt({
      type: "input",
      name: "name",
      message: `Which npm package do you want to ${command}?`,
    })

    spawn(
      env.SIMPLE_NPM,
      [command, ...npmPackage.name.split(" ")],
      options
    )

    const shortcut = {
      install: "i",
      uninstall: "un",
    }

    nextTime(
      env.SIMPLE_NAME +
        " " +
        shortcut[command] +
        " " +
        npmPackage.name
    )
  }
}

const spawnScript = command => async () => {
  let child = spawn(
    env.SIMPLE_PATH + "/config/" + command + ".sh",
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
    action: () => {
      spawn(`edit`, [...args], { stdio: "inherit" })
    },
  },
  ["ls"]: {
    message: "List all scripts",
    action: async () => {
      let pattern = new RegExp(sourceArg || "")

      ls(env.SIMPLE_BIN_PATH)
        .toString()
        .split(",")
        .filter(name => name.match(pattern))
        .forEach(name => echo(name))

      if (!action) nextTime(`${env.SIMPLE_NAME} ls`)
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
      edit(path.join(env.SIMPLE_PATH, ".env"))
      if (!action) nextTime(`${env.SIMPLE_NAME} env`)
    },
  },
  ["issue"]: {
    message: "File an issue on github",
    action: run("issue"),
  },
  ["update"]: {
    message: "Update simple",
    action: spawnScript("update"),
  },
  ["quit"]: {
    message: "Quit simple",
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
      (await env("SIMPLE_TEMPLATE")) == "tutorial"
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
    console.log(
      chalk.red(action + " is not a valid argument")
    )
  }
}
