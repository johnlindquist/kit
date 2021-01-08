// Description: Opens the selected script in your editor

let file = await arg(`Which script do you want to edit?`, {
  type: "autocomplete",
  choices: (await run("cli/scripts-info"))[0],
  validate: async input => {
    let [scripts] = await run("cli/scripts-info")

    let valid = scripts
      .map(script => script.name)
      .includes(input)

    if (valid) return true

    return chalk`Script {green.bold ${input}} not found. Please select a different script:`
  },
})

let fileName = file + ".js"
edit(path.join(env.SIMPLE_SCRIPTS_PATH, fileName))
