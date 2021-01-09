// Description: Opens the selected script in your editor
let choices = async () => {
  let [scripts] = await run("cli/scripts-info")
  return scripts.map(script => script.value)
}

let file = await arg(`Which script do you want to edit?`, {
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
})

let fileName = file + ".js"
edit(path.join(env.SIMPLE_SCRIPTS_PATH, fileName))
