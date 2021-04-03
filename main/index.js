// Menu: Main
// Description: Script Kit
// Shortcut: cmd ;

//Note: Feel free to edit this file!
let { menu, scripts, validate } = await cli("fns")

const Share = async () => {
  let cliScript = await arg(
    {
      placeholder: `Which script do you want to share?`,
    },
    menu
  )

  let how = await arg("How would you like to share?", [
    {
      name: "Copy script to clipboard",
      value: "share-copy",
    },
    {
      name: "Post as a gist",
      value: "share-script",
    },
    {
      name: "Create install link",
      value: "share-script-as-link",
    },
  ])

  await cli(how, cliScript)
}

const NewScript = async () => {
  let cliScript = await arg(
    "How would you like to create a script?",
    [
      {
        name: "New from name",
        description: "Enter a script name",
        value: "new",
      },
      {
        name: "New from url",
        description: "Enter a url then name it",
        value: "new-from-url",
      },
      {
        name: "Browse Community Examples",
        description:
          "Visit scriptkit.app/scripts/johnlindquist for a variety of examples",
        value: "browse-examples",
      },
    ]
  )

  if (cliScript === "browse-examples") {
    exec(`open https://scriptkit.app/scripts/johnlindquist`)
    return
  }

  await cli(cliScript)
}

const Other = async () => {
  let { host, port } = await new Promise((res, rej) => {
    let messageHandler = data => {
      if (data.channel === "SERVER") {
        res(data)
        process.off("message", messageHandler)
      }
    }
    process.on("message", messageHandler)

    send("GET_SERVER_STATE")
  })

  let cliScript = await arg(
    {
      placeholder: `Other options:`,
    },
    [
      {
        name: "Get Help",
        description: `Post a question to Script Kit GitHub discussions`,
        value: "get-help",
      },
      {
        name: "Check for Update",
        description: `Version: ${env.KIT_APP_VERSION}`,
        value: "update",
      },
      {
        name: "Manage npm packages",
        description: `add or remove npm package`,
        value: "manage-npm",
      },
      {
        name: host && port ? "Stop Server" : "Start Server",
        description:
          host && port
            ? `Server running on http://${host}:${port}`
            : "",
        value: "toggle-server",
      },
      {
        name: "Open Script Kit at Login",
        description: "Sets Script Kit to launch at login",
        value: "open-at-login",
      },
      {
        name: "Add ~/.kenv/bin to $PATH",
        description: `Looks for your profile and appends to $PATH`,
        value: "add-kenv-to-profile",
      },
      {
        name: "Quit",
        description: `Quit Script Kit`,
        value: "quit",
      },
    ]
  )

  if (cliScript === "get-help") {
    await exec(
      `open https://github.com/johnlindquist/kit/discussions`
    )
    return
  }

  await cli(cliScript)
}

const Edit = async () => {
  let script = await arg(
    {
      placeholder: `Which script do you want to edit?`,
      validate,
    },
    menu
  )

  script = script.endsWith(".js") ? script : `${script}.js`

  let editAction = await arg("Which action?", [
    {
      name: "Edit",
      description: `Open ${script} in ${env.KIT_EDITOR}`,
      value: "edit",
    },
    {
      name: "Duplicate",
      description: `Make a copy of ${script} and open in ${env.KIT_EDITOR}`,
      value: "duplicate",
    },
    {
      name: "Rename",
      description: `Prompt to rename ${script}`,
      value: "rename",
    },
    {
      name: "Remove",
      description: `Delete ${script} to trash`,
      value: "remove",
    },
  ])

  await cli(editAction, script)
}

const Run = async () => {
  await cli("run")
}

onTab("Run", Run)
onTab("Edit", Edit)
onTab("Share", Share)
onTab("New", NewScript)
onTab("Other", Other)
