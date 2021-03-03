const { getEventListeners } = require("events")

const fromInput = async (choices, input) => {
  send("UPDATE_PROMPT_CHOICES", {
    kitScript,
    parentScript: env.KIT_PARENT_NAME,
    kitArgs: args.join(" "),
    input,
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
  } = config

  if (type === "confirm") {
    choices = [
      { name: "Yes", value: true },
      { name: "No", value: false },
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
    send("SHOW_PROMPT_WITH_DATA", {
      message,
      preview,
      kitScript,
      parentScript: env.KIT_PARENT_NAME,
      kitArgs: args.join(" "),
      choices,
      cache,
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

      if (validate) {
        let valid = await validate(data)

        if (typeof valid === "string") {
          send("UPDATE_PROMPT_WARN", {
            info: valid,
          })
        } else {
          resolve(data)
        }
      } else {
        resolve(data)
      }
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
  if (firstArg) {
    let valid = true
    if (messageOrConfig?.validate) {
      let { validate } = messageOrConfig
      let validOrMessage = await validate(firstArg)
      if (
        typeof validOrMessage === "string" ||
        !validOrMessage
      ) {
        send("UPDATE_PROMPT_WARN", {
          info:
            validOrMessage || "Invalid value. Try again:",
        })
        valid = false
      }
    }

    if (valid) {
      return firstArg
    }
  }

  if (typeof messageOrConfig === "undefined") {
    return await prompt({ message: "Enter arg:" })
  }

  if (typeof messageOrConfig === "string") {
    return await prompt({
      message: messageOrConfig,
      choices,
      cache,
    })
  }

  let { message, validate, preview } = messageOrConfig

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
