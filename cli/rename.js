let choices = async () => {
  let [scripts] = await run("cli/scripts-info")
  return scripts.map(script => script.value)
}

let script = await arg(
  `Which script do you want to rename?`,
  {
    type: "autocomplete",
    choices,
    validate: async function (input) {
      let scripts =
        this?.choices.map(choice => choice.value) ||
        (await choices())
      let valid = scripts.includes(input)

      if (valid) return true

      return chalk`Script {green.bold ${input}} not found. Please select a different script:`
    },
  }
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
mv(oldFilePath, newFilePath)
await run("cli/create-bin", ["scripts/" + newScript])
trash(path.join(env.SIMPLE_BIN_PATH, script))
