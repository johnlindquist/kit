// Description: Run the selected script
let [scripts] = await run("cli/scripts-info")
let choices = scripts.map(script => script.value)

let file = await arg(`Which script do you want to run?`, {
  choices,
  validate: async function (input) {
    let scripts =
      this?.choices.map(choice => choice.value) ||
      (await choices())
    let valid = scripts.includes(input)

    if (valid) return true

    return chalk`Script {green.bold ${input}} not found. Please select a different script:`
  },
})

let fileName = file + ".js"
await run(path.join(env.SIMPLE_SCRIPTS_PATH, fileName))
