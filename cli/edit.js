// Description: Opens the selected script in your editor

let file = await arg(`Which script do you want to edit?`, {
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
})

let fileName = file + ".js"
edit(path.join(env.SIMPLE_SCRIPTS_PATH, fileName))
