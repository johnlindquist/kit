exports.prompt = async config => {
  // console.log(`\n\n >>> TTY PROMPT <<< \n\n`)
  if (config?.choices) {
    config = { ...config, type: "autocomplete" }
  }
  config = { type: "input", name: "value", ...config }
  if (arg?.app && process.send) {
    if (typeof config.choices === "function") {
      config = { ...config, type: "lazy" }
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
          return choice
        }),
      }
    }

    // if (setFrontMost) setFrontMost()
    process.send({ ...config, from: "prompt" })

    let messageHandler
    let errorHandler
    let value = await new Promise((resolve, reject) => {
      messageHandler = async data => {
        //The App is requesting to run the arg choices func
        // console.log("process.on('message'):", data)

        //If you're typing input, send back choices based on the function
        if (
          data?.from === "input" &&
          typeof config?.choices == "function"
        ) {
          process.send({
            from: "choices",
            choices: (
              await config.choices(data?.input)
            ).map(choice => {
              if (typeof choice === "string") {
                return {
                  name: choice,
                  value: choice,
                }
              }
              return choice
            }),
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

  if (typeof config.choices === "function") {
    let f = config.choices

    let suggest = _.debounce(async function (input) {
      let results = await f(
        input.replace(/[^0-9a-z]/gi, "")
      )
      this.choices = await this.toChoices(results)
      await this.render()

      return this.choices
    }, 250)

    config = {
      ...config,
      choices: [],
      suggest,
    }
  }

  // TODO: Strip out enquirer autocomplete
  let { value } = await require("enquirer").prompt(config)

  return value
}

exports.arg = async (
  message = "Input",
  promptConfig = {}
) => {
  if (args[0]) {
    let attemptArg = args.shift()
    if (promptConfig?.validate) {
      let validate = promptConfig.validate
      let valid = false
      if (validate.constructor.name == "AsyncFunction") {
        valid = await validate(attemptArg)
      } else {
        valid = validate(attemptArg)
      }
      if (typeof valid == "boolean" && valid) {
        return attemptArg
      } else {
        //don't return, just update message
        promptConfig.message = valid
      }
    } else {
      return attemptArg
    }
  }

  let input = await prompt({
    message,
    ...promptConfig,
  })

  let command = chalk`{green.bold ${
    env.SIMPLE_SCRIPT_NAME
  } {yellow ${input}}} {yellow ${argOpts.join(" ")}}`

  // TODO: Should I care about teaching this?
  let nextTime =
    chalk`👉 Run without prompts by typing: ` + command
  // console.log(nextTime)

  return input
}

exports.npm = async packageName => {
  try {
    return await import(packageName)
  } catch {
    if (!arg?.trust) {
      let installMessage = chalk`\n{green ${env.SIMPLE_SCRIPT_NAME}} needs to install the npm library: {yellow ${packageName}}`

      let downloadsMessage = chalk`{yellow ${packageName}} has had {yellow ${
        (
          await get(
            `https://api.npmjs.org/downloads/point/last-week/` +
              packageName
          )
        ).data.downloads
      }} downloads from npm in the past week`

      let packageLink = `https://npmjs.com/package/${packageName}`
      let readMore = chalk`
    Read more about {yellow ${packageName}} here: {yellow ${packageLink}}
    `
      echo(installMessage)
      echo(downloadsMessage)
      echo(readMore)

      let message = chalk`Do you trust {yellow ${packageName}}?`

      let config = {
        message,
        choices: [
          { name: "Yes", value: true },
          { name: "No", value: false },
        ],
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

exports.show = async (html, options) => {
  console.log(html)
}

exports.showMarkdown = async (markdown, options) => {
  let markdownHtml = (await npm("marked")).default(
    markdown.trim()
  )

  console.log(markdown)
}
