const { getEventListeners } = require("events")

const fromInput = async (choices, input) => {
  let scriptInfo = await cli("info", kitScript)
  send("UPDATE_PROMPT_CHOICES", {
    tabs: tabs?.length ? tabs.map(({ name }) => name) : [],
    tabIndex: tabs?.findIndex(({ name }) => arg?.tab),
    scriptInfo,
    kitScript,
    parentScript: env.KIT_PARENT_NAME,
    kitArgs: args.join(" "),
    input,
    cache: false,
    choices: (await choices(input)).map(choice => {
      if (typeof choice === "string") {
        return {
          name: choice,
          value: choice,
        }
      }
      choice.uuid = uuid()
      return choice
    }),
  })
}

prompt = async (config = {}) => {
  let {
    message = "",
    validate = null,
    preview = "",
    choices = [],
    type = "",
    cache = false,
    secret = false,
  } = config

  if (type === "confirm") {
    choices = [
      { name: "No", value: false },
      { name: "Yes", value: true },
    ]
  }

  if (
    choices &&
    typeof choices === "function" &&
    choices.length === 0
  ) {
    choices = choices()
    if (typeof choices?.then === "function") {
      choices = await choices
    }
  }

  if (typeof choices === "object") {
    choices = choices.map(choice => {
      if (typeof choice === "string") {
        return {
          name: choice,
          value: choice,
          id: uuid(),
        }
      }

      if (typeof choice === "object") {
        if (!choice?.id) {
          choice.id = uuid()
        }
      }

      return choice
    })
  }

  if (arg["kit-input"]) {
    //Got cache, so silently pass arg
    fromInput(choices, arg["kit-input"])
  }
  if (!arg["prompt-exists"]) {
    let scriptInfo = await cli("info", kitScript)

    send("SHOW_PROMPT_WITH_DATA", {
      tabs: tabs?.length
        ? tabs.map(({ name }) => name)
        : [],
      tabIndex: tabs?.findIndex(({ name }) => arg?.tab),
      scriptInfo,
      message,
      preview,
      kitScript,
      parentScript: env.KIT_PARENT_NAME,
      kitArgs: args.join(" "),
      choices,
      cache: false,
      secret,
    })
  }

  let messageHandler
  let errorHandler

  let value = await new Promise((resolve, reject) => {
    messageHandler = async data => {
      //If you're typing input, send back choices based on the function
      if (data?.from === "INPUT_CHANGED") {
        if (typeof choices === "function") {
          fromInput(choices, data.input)
        }
        return
      }

      if (data?.from === "TAB_CHANGED") {
        if (data?.tab && tabs) {
          console.log(`RECEIVING TAB_CHANGED ${data?.tab}`)
          process.off("message", messageHandler)
          process.off("error", errorHandler)
          let tabIndex = tabs.findIndex(({ name }) => {
            return name == data?.tab
          })
          currentTab = tabs[tabIndex].fn()
        }
        return
      }

      if (validate) {
        let valid = await validate(data)

        if (typeof valid === "string") {
          send("UPDATE_PROMPT_WARN", {
            info: valid,
          })

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

  let { validate, preview } = messageOrConfig
  if (!message) message = messageOrConfig.message

  return await prompt({
    message,
    validate,
    preview,
    choices,
    cache,
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
        preview: `<div>
        <div>${installMessage}</div>
        <div>${downloadsMessage}</div>
        <div><a href="${readMore}">${readMore}</a></div>        
        </div>`,
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
