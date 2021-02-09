let { choices, validate } = await import("./scripts.js")

let script = await arg(
  `Which script do you want to duplicate?`,
  choices,
  validate
)

let newScript = await arg(`Enter the new script name:`, {
  validate: async input => {
    let result = exec(`command -v ${input}`, {
      silent: true,
    })

    if (result.stdout) {
      return chalk`{red.bold ${input}} already exists. Please choose another name.`
    }

    return true
  },
})

let oldFilePath = path.join(
  env.SIMPLE_SCRIPTS_PATH,
  script + ".js"
)
let newFilePath = path.join(
  env.SIMPLE_SCRIPTS_PATH,
  newScript + ".js"
)
cp(oldFilePath, newFilePath)
await simple("cli/create-bin", ["scripts/" + newScript])

edit(newFilePath, env.SIMPLE_PATH)
