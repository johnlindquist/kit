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
    placeholder = "",
    validate = null,
    choices = [],
    secret = false,
    hint = "",
    input = "",
  } = config

  setMode("FILTER")

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
      placeholder,
      kitScript,
      parentScript: env.KIT_PARENT_NAME,
      kitArgs: args.join(" "),
      cache: false,
      secret,
    })

    if (hint) setHint(hint)
    if (input) setInput(input)

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
          setPlaceholder(valid)
          setChoices(kitPrevChoices)

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

arg = async (
  placeholderOrConfig,
  choices,
  cache = false
) => {
  let firstArg = args.length ? args.shift() : null
  let placeholder = ""
  if (firstArg) {
    let valid = true
    if (placeholderOrConfig?.validate) {
      let { validate } = placeholderOrConfig
      let validOrMessage = await validate(firstArg)
      valid =
        typeof validOrMessage === "boolean" &&
        validOrMessage

      if (typeof validOrMessage === "string")
        placeholder = validOrMessage
    }

    if (valid) {
      return firstArg
    }
  }

  if (typeof placeholderOrConfig === "undefined") {
    return await prompt({ placeholder })
  }

  if (typeof placeholderOrConfig === "string") {
    if (!placeholder) placeholder = placeholderOrConfig
    return await prompt({
      placeholder,
      choices,
      cache,
    })
  }

  let { validate, hint, input } = placeholderOrConfig
  if (!placeholder)
    placeholder = placeholderOrConfig.placeholder

  return await prompt({
    placeholder,
    validate,
    choices,
    cache,
    hint,
    input,
  })
}

npm = async packageName => {
  try {
    return require(packageName)
  } catch {
    if (!arg?.trust) {
      let placeholder = `${env.KIT_SCRIPT_NAME}} needs to install : ${packageName}`

      let downloadsMessage = `${packageName} has had ${
        (
          await get(
            `https://api.npmjs.org/downloads/point/last-week/` +
              packageName
          )
        ).data.downloads
      } downloads from npm in the past week`

      let packageLink = `https://npmjs.com/package/${packageName}`

      let trust = await arg(
        { placeholder, hint: downloadsMessage },
        [
          {
            name: `Abort`,
            value: "false",
          },
          {
            name: `Install ${packageName}`,
            value: "true",
          },
          {
            name: `Visit ${packageLink}}`,
            value: "visit",
          },
        ]
      )
      if (trust === "visit") {
        exec(`open ${packageLink}`)
        exit()
      }

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

setInput = async input => {
  send("SET_INPUT", {
    input,
  })
}

sendResponse = async value => {
  send("SEND_RESPONSE", {
    value,
  })
}
