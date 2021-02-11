const { getEventListeners } = require("events")

const fromInput = async (choices, input) => {
  process.send({
    simpleScript,
    parentScript: env.SIMPLE_PARENT_NAME,
    simpleArgs: args.join(" "),
    from: "updateChoices",
    input,
    choices: (await choices(input)).map(choice => {
      if (typeof choice === "string") {
        return {
          name: choice,
          value: choice,
        }
      }
      choice.uuid = v4()
      return choice
    }),
  })
}

exports.prompt = async config => {
  let {
    message = "",
    validate = () => {},
    preview = "",
    choices = [],
  } = config
  //TODO: Handle validation

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
        }
      }
      choice.uuid = v4()
      return choice
    })
  }

  if (arg["simple-input"]) {
    //Got cache, so silently pass arg
    fromInput(choices, arg["simple-input"])
  }
  if (!arg["prompt-exists"]) {
    process.send({
      message,
      preview,
      simpleScript,
      parentScript: env.SIMPLE_PARENT_NAME,
      simpleArgs: args.join(" "),
      from: "prompt",
      choices,
      cache: typeof choices !== "function",
    })
  }

  let messageHandler
  let errorHandler
  let value = await new Promise((resolve, reject) => {
    messageHandler = async data => {
      //If you're typing input, send back choices based on the function
      if (
        data?.from === "input" &&
        typeof choices === "function"
      ) {
        fromInput(choices, data.input)
        return
      }

      //The App returned normal data
      resolve(data)
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

exports.arg = async (messageOrConfig, choices) => {
  if (args.length) return args.shift()

  if (typeof messageOrConfig === "string") {
    return await prompt({
      message: messageOrConfig,
      choices,
    })
  }

  let { message, validate, preview } = messageOrConfig

  return await prompt({
    message,
    validate,
    preview,
    choices,
  })
}

exports.npm = async packageName => {
  try {
    return await import(packageName)
  } catch {
    if (!arg?.trust) {
      let installMessage = `${env.SIMPLE_SCRIPT_NAME}} needs to install the npm library: ${packageName}`

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
      }

      let trust = await prompt(config)
      if (trust === "false") {
        echo(`Ok. Exiting...`)
        exit()
      }
    }

    await install([packageName])
    let packageJson = require(simplePath(
      "node_modules",
      packageName,
      "package.json"
    ))

    return await import(
      simplePath(
        "node_modules",
        packageName,
        packageJson.main
      )
    )
  }
}

let addPadding = html =>
  `<div class="p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">${html}</div>`

exports.show = async (html, options) => {
  if (typeof html === "object")
    html = JSON.stringify(html, null, "\t")
  process.send({
    from: "show",
    html: addPadding(html),
    options,
  })
}

exports.showMarkdown = async (markdown, options) => {
  let markdownHtml = (await npm("marked")).default(
    markdown.trim()
  )

  process.send({
    from: "show",
    html: addPadding(markdownHtml),
    options,
  })
}
