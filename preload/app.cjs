prompt = async config => {
  if (config?.choices) {
    config = { ...config, type: "autocomplete" }
  }
  config = { type: "input", name: "value", ...config }
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

  if (setFrontMost) setFrontMost()
  process.send({ ...config, from: "prompt" })

  let resolve = null
  let reject = null

  let value = await new Promise((res, rej) => {
    resolve = res
    reject = rej

    process.on("message", async data => {
      //The App is requesting to run the arg choices func
      // console.log("process.on('message'):", data)
      // TODO: Consider validation
      if (
        data?.from === "input" &&
        typeof config?.choices == "function"
      ) {
        process.send({
          from: "choices",
          choices: (await config.choices(data?.input)).map(
            choice => {
              console.log({ choice })
              if (typeof choice === "string") {
                return {
                  name: choice,
                  value: choice,
                }
              }
              return choice
            }
          ),
        })

        return
      }
      res(data)
    })
    process.on("error", reject)
  })

  process.removeAllListeners()
  return value
}

arg = async (message = "Input", promptConfig = {}) => {
  return prompt({
    message,
    ...promptConfig,
  })
}

env = async (envKey, promptConfig = {}) => {
  if (env[envKey]) return env[envKey]

  let input = await prompt({
    message: `Set ${envKey} env to:`,
    ...promptConfig,
  })

  if (input.startsWith("~"))
    input = input.replace("~", env.HOME)

  await run("cli/set-env-var", envKey, input)
  env[envKey] = input
  return input
}

npm = async packageName => {
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

      let config = {
        message,
        choices: [
          { name: "Yes", value: true },
          { name: "No", value: false },
        ],
      }

      config = {
        ...config,
        message,
        choices: config.choices.map(choice => {
          return {
            ...choice,
            info: `<div>
          <div>${installMessage}</div>
          <div>${downloadsMessage}</div>
          <div>${readMore}</div>
          </div>`,
          }
        }),
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
