let displayChoices = choices => {
  switch (typeof choices) {
    case "string":
      setPanel(choices)
      break

    case "object":
      setChoices(choices)
      break
  }
}

let fromInput = async (choices, input) => {
  displayChoices(await choices(input))
}

prompt = async (config = {}) => {
  let {
    message = "",
    validate = null,
    choices = [],
    type = "",
    cache = false,
    secret = false,
    hint = "",
  } = config

  setMode("FILTER")

  if (type === "confirm") {
    choices = [
      { name: "No", value: false },
      { name: "Yes", value: true },
    ]
  }

  if (choices && typeof choices === "function") {
    if (choices?.length === 0) {
      choices = choices()
      if (typeof choices?.then === "function") {
        choices = await choices
      }
    } else {
      //When choices is a function with an argument
      setMode("GENERATE")
    }
  }

  if (arg["kit-input"]) {
    //Got cache, so silently pass arg
    fromInput(choices, arg["kit-input"])
  }
  if (!arg["prompt-exists"]) {
    let scriptInfo = await cli("info", kitScript)

    send("SHOW_PROMPT", {
      tabs: onTabs?.length
        ? onTabs.map(({ name }) => name)
        : [],
      tabIndex: onTabs?.findIndex(({ name }) => arg?.tab),
      scriptInfo,
      message,
      kitScript,
      parentScript: env.KIT_PARENT_NAME,
      kitArgs: args.join(" "),
      cache: false,
      secret,
    })

    setHint(hint)

    displayChoices(choices)
  }

  let messageHandler
  let errorHandler

  let value = await new Promise((resolve, reject) => {
    messageHandler = async data => {
      //If you're typing input, send back choices based on the function
      if (data?.channel === "GENERATE_CHOICES") {
        if (
          typeof choices === "function" &&
          choices?.length > 0
        ) {
          fromInput(choices, data.input)
        }
        return
      }

      if (data?.channel === "TAB_CHANGED") {
        if (data?.tab && onTabs) {
          process.off("message", messageHandler)
          process.off("error", errorHandler)
          let tabIndex = onTabs.findIndex(({ name }) => {
            return name == data?.tab
          })

          currentOnTab = onTabs[tabIndex].fn(data?.input)
        }
        return
      }

      if (validate) {
        let valid = await validate(data)

        if (typeof valid === "string") {
          setPromptText(valid)

          return
        }
      }
      resolve(data)

      tabs = []
    }

    errorHandler = () => {
      reject()
    }

    process.on("message", messageHandler)
    process.on("error", errorHandler)
  })

  process.off("message", messageHandler)
  process.off("error", errorHandler)

  return value
}

arg = async (messageOrConfig, choices, cache = false) => {
  let firstArg = args.length ? args.shift() : null
  let message = ""
  if (firstArg) {
    let valid = true
    if (messageOrConfig?.validate) {
      let { validate } = messageOrConfig
      let validOrMessage = await validate(firstArg)
      valid =
        typeof validOrMessage === "boolean" &&
        validOrMessage

      if (typeof validOrMessage === "string")
        message = validOrMessage
    }

    if (valid) {
      return firstArg
    }
  }

  if (typeof messageOrConfig === "undefined") {
    return await prompt({ message })
  }

  if (typeof messageOrConfig === "string") {
    if (!message) message = messageOrConfig
    return await prompt({
      message,
      choices,
      cache,
    })
  }

  let { validate, hint } = messageOrConfig
  if (!message) message = messageOrConfig.message

  return await prompt({
    message,
    validate,
    choices,
    cache,
    hint,
  })
}

npm = async packageName => {
  try {
    return require(packageName)
  } catch {
    if (!arg?.trust) {
      let installMessage = `${env.KIT_SCRIPT_NAME}} needs to install the npm library: ${packageName}`

      let downloadsMessage = `${packageName} has had ${
        (
          await get(
            `https://api.npmjs.org/downloads/point/last-week/` +
              packageName
          )
        ).data.downloads
      } downloads from npm in the past week`

      let packageLink = `https://npmjs.com/package/${packageName}`
      let readMore = `
    Read more about ${packageName} here: ${packageLink}
    `

      let message = `Do you trust ${packageName}?`

      config = {
        message,
        choices: [
          {
            name: `Yes, install ${packageName}`,
            value: "true",
          },
          {
            name: `No, abort`,
            value: "false",
          },
        ],
        cache: false,
      }

      let trust = await prompt(config)
      if (trust === "false") {
        echo(`Ok. Exiting...`)
        exit()
      }
    }

    await cli("install", packageName)
    let packageJson = require(kenvPath(
      "node_modules",
      packageName,
      "package.json"
    ))

    return require(kenvPath(
      "node_modules",
      packageName,
      packageJson.main
    ))
  }
}

setPanel = async html => {
  send("SET_PANEL", { html })
}

setMode = async mode => {
  send("SET_MODE", {
    mode,
  })
}

setHint = async hint => {
  send("SET_HINT", {
    hint,
  })
}
