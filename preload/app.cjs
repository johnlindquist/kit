const { getEventListeners } = require("events")

exports.prompt = async config => {
  let type = "input"

  if (config?.type === "confirm") {
    config.choices = [
      { name: "Yes", value: true },
      { name: "No", value: false },
    ]
  }

  if (config?.choices) {
    type = "autocomplete"
  }
  if (typeof config?.choices === "function") {
    type = "lazy"
  }

  config = {
    type,
    message: "Input:",
    name: "value",
    ...config,
  }

  if (typeof config?.choices === "object") {
    config = {
      ...config,
      choices: config.choices.map(choice => {
        if (typeof choice === "string") {
          return {
            name: choice,
            value: choice,
          }
        }
        choice.uuid = v4()
        return choice
      }),
    }
  }

  process.send({ ...config, from: "prompt" })

  let messageHandler
  let errorHandler
  let value = await new Promise((resolve, reject) => {
    messageHandler = async data => {
      //If you're typing input, send back choices based on the function
      if (
        data?.from === "input" &&
        typeof config?.choices == "function"
      ) {
        process.send({
          from: "choices",
          choices: (await config.choices(data?.input)).map(
            choice => {
              if (typeof choice === "string") {
                return {
                  name: choice,
                  value: choice,
                }
              }
              choice.uuid = v4()
              return choice
            }
          ),
        })

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

exports.arg = async (
  message = "Input",
  promptConfig = {}
) => {
  if (args.length) return args.shift()
  return prompt({
    message,
    ...promptConfig,
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
        type: "confirm",
        message,
        info: `<div>
        <div>${installMessage}</div>
        <div>${downloadsMessage}</div>
        <div><a href="${readMore}">${readMore}</a></div>        
        </div>`,
      }

      let trust = await prompt(config)
      if (!trust) {
        echo(`Ok. Exiting...`)
        exit()
      }
    }
    echo(
      chalk`Installing {yellow ${packageName}} and continuing.`
    )

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
