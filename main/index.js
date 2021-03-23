// Menu: Main
// Description: Script Kit
// Shortcut: cmd ;

//Note: Feel free to edit this file!
let { menu, scripts, validate } = await cli("fns")

const Share = async () => {
  let cliScript = await arg(
    {
      message: `Which script do you want to share?`,
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
        name: "New from template",
        description:
          "Enter a script name then select a template",
        value: "new-from-template",
      },
      {
        name: "New from url",
        description: "Enter a url then name it",
        value: "new-from-url",
      },
    ]
  )

  await cli(cliScript)
}

const Other = async () => {
  let { host, port } = await new Promise((res, rej) => {
    let messageHandler = data => {
      if (data.from === "SERVER") {
        res(data)
        process.off("message", messageHandler)
      }
    }
    process.on("message", messageHandler)

    send("GET_SERVER_STATE")
  })

  let cliScript = await arg(
    {
      message: `Other options:`,
    },
    [
      {
        name: "Check for Update",
        description: `Version: ${env.KIT_APP_VERSION}`,
        value: "update",
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

  await cli(cliScript)
}

const Edit = async () => {
  await cli("edit")
}

const Run = async () => {
  await cli("run")
}

tab("Run", Run)
tab("Edit", Edit)
tab("Share", Share)
tab("New", NewScript)
tab("Other", Other)
