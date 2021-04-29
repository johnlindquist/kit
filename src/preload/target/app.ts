import { MODE, CHANNELS } from "../../enums"
import { assignPropsTo } from "../utils"

let displayChoices = (choices: Choice<any>[]) => {
  switch (typeof choices) {
    case "string":
      global.setPanel(choices)
      break

    case "object":
      global.setChoices(choices)
      break
  }
}

let checkTabChanged = (
  data,
  messageHandler,
  errorHandler?
) => {
  if (data?.tab && global.onTabs) {
    process.off("message", messageHandler)
    if (errorHandler) process.off("error", errorHandler)
    updateTab(data)
  }
}

let updateTab = data => {
  let tabIndex = global.onTabs.findIndex(({ name }) => {
    return name == data?.tab
  })

  global.onTabIndex = tabIndex
  global.currentOnTab = global.onTabs[tabIndex].fn(
    data?.input
  )
}

// TODO: Refactor into RxJS :D
let promptId = 0
let waitForPrompt = async ({ choices, validate }) => {
  promptId++
  let messageHandler: (data: any) => void
  let errorHandler: () => void

  let value = await new Promise(async (resolve, reject) => {
    let currentPromptId = promptId

    global.setMode(
      typeof choices === "function" && choices?.length > 0
        ? MODE.GENERATE
        : MODE.FILTER
    )

    let invokeChoices = (input: string) => {
      let resultOrPromise = choices(input)
      if (resultOrPromise.then) {
        resultOrPromise.then(result => {
          if (currentPromptId === promptId)
            displayChoices(result)
        })
      } else {
        displayChoices(resultOrPromise)
      }
    }

    if (typeof choices === "function") {
      invokeChoices("")
    } else {
      displayChoices(choices as any)
    }

    messageHandler = async data => {
      switch (data?.channel) {
        case CHANNELS.GENERATE_CHOICES:
          invokeChoices(data?.input)
          break

        case CHANNELS.TAB_CHANGED:
          checkTabChanged(
            data,
            messageHandler,
            errorHandler
          )
          break

        case CHANNELS.VALUE_SUBMITTED:
          let { value } = data
          if (validate) {
            let validateMessage = await validate(value)

            if (typeof validateMessage === "string") {
              global.setPlaceholder(validateMessage)
              global.setChoices(global.kitPrevChoices)

              return
            }
          }
          resolve(value)
          break
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

global.kitPrompt = async (config: PromptConfig) => {
  let {
    placeholder = "",
    validate = null,
    choices = [],
    secret = false,
    hint = "",
    input = "",
    drop = false,
    ignoreBlur = false,
    mode = MODE.FILTER,
  } = config

  global.setMode(mode)

  let scriptInfo = await global.cli(
    "info",
    global.kitScript
  )

  global.send("SHOW_PROMPT", {
    tabs: global.onTabs?.length
      ? global.onTabs.map(({ name }) => name)
      : [],
    tabIndex: global.onTabs?.findIndex(
      ({ name }) => global.arg?.tab
    ),
    scriptInfo,
    placeholder,
    kitScript: global.kitScript,
    parentScript: global.env.KIT_PARENT_NAME,
    kitArgs: global.args.join(" "),
    secret,
    drop,
  })

  global.setHint(hint)
  if (input) global.setInput(input)
  if (ignoreBlur) global.setIgnoreBlur(true)

  return await waitForPrompt({ choices, validate })
}

global.drop = async (hint = "") => {
  return await global.kitPrompt({
    placeholder: "Waiting for drop...",
    hint,
    drop: true,
    ignoreBlur: true,
  })
}

global.hotkey = async (
  placeholder = "Press a key combo:"
) => {
  return await global.kitPrompt({
    placeholder,
    mode: MODE.HOTKEY,
  })
}

global.arg = async (placeholderOrConfig, choices) => {
  let firstArg = global.args.length
    ? global.args.shift()
    : null
  let placeholderOrValidateMessage = ""
  if (firstArg) {
    let valid = true
    if (
      typeof placeholderOrConfig !== "string" &&
      placeholderOrConfig?.validate
    ) {
      let { validate } = placeholderOrConfig
      let validOrMessage = await validate(firstArg)
      valid =
        typeof validOrMessage === "boolean" &&
        validOrMessage

      if (typeof validOrMessage === "string")
        placeholderOrValidateMessage = validOrMessage
    }

    if (valid) {
      return firstArg
    }
  }

  if (typeof placeholderOrConfig === "undefined") {
    return await global.kitPrompt({
      placeholder: placeholderOrValidateMessage,
    })
  }

  if (typeof placeholderOrConfig === "string") {
    return await global.kitPrompt({
      placeholder: placeholderOrConfig,
      choices,
    })
  }

  return await global.kitPrompt({
    choices,
    ...placeholderOrConfig,
  })
}

global.updateArgs = arrayOfArgs => {
  let argv = require("minimist")(arrayOfArgs)
  global.args = [...global.args, ...argv._]
  global.argOpts = Object.entries(argv)
    .filter(([key]) => key != "_")
    .flatMap(([key, value]) => {
      if (typeof value === "boolean") {
        if (value) return [`--${key}`]
        if (!value) return [`--no-${key}`]
      }
      return [`--${key}`, value]
    })

  assignPropsTo(argv, global.arg)
}
global.updateArgs(process.argv.slice(2))

global.npm = async packageName => {
  try {
    return require(packageName)
  } catch {
    if (!global.arg?.trust) {
      let placeholder = `${packageName} is required for this script`

      let packageLink = `https://npmjs.com/package/${packageName}`

      let hint = `[${packageName}](${packageLink}) has had ${
        (
          await get(
            `https://api.npmjs.org/downloads/point/last-week/` +
              packageName
          )
        ).data.downloads
      } downloads from npm in the past week`

      let trust = await global.arg(
        { placeholder, hint: md(hint) },
        [
          {
            name: `Abort`,
            value: "false",
          },
          {
            name: `Install ${packageName}`,
            value: "true",
          },
        ]
      )

      if (trust === "false") {
        echo(`Ok. Exiting...`)
        exit()
      }
    }

    setHint(`Installing ${packageName}...`)

    await global.cli("install", packageName)
    let packageJson = require(global.kenvPath(
      "node_modules",
      packageName,
      "package.json"
    ))

    setHint("")

    return require(global.kenvPath(
      "node_modules",
      packageName,
      packageJson.main
    ))
  }
}

global.setPanel = async html => {
  global.send("SET_PANEL", { html })
}

global.setMode = async mode => {
  global.send("SET_MODE", {
    mode,
  })
}

global.setHint = async hint => {
  global.send("SET_HINT", {
    hint,
  })
}

global.setInput = async input => {
  global.send("SET_INPUT", {
    input,
  })
}

global.setIgnoreBlur = async ignore => {
  global.send("SET_IGNORE_BLUR", { ignore })
}

global.sendResponse = async value => {
  global.send("SEND_RESPONSE", {
    value,
  })
}
