let script = await arg(
  `Which script do you want to duplicate?`,
  {
    type: "autocomplete",
    choices: (await run("cli/scripts-info"))[0].map(
      script => script.value
    ),
    validate: async function (input) {
      let valid = this.choices
        .map(script => script.value)
        .includes(input)

      if (valid) return true

      exit()

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
cp(oldFilePath, newFilePath)
await run("cli/create-bin", ["scripts/" + newScript])

edit(newFilePath, env.SIMPLE_PATH)
