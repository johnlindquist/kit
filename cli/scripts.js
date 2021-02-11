let { scripts } = await simple("cli/scripts-info")

export let choices = scripts
  .map(script => {
    let {
      command,
      menu,
      value,
      shortcut,
      description,
    } = script
    return {
      name:
        (menu || command) +
        (shortcut ? `: ${shortcut}` : ``),
      value: command,
      description,
    }
  })
  .sort((a, b) => {
    let aName = a.name.toLowerCase()
    let bName = b.name.toLowerCase()

    return aName > bName ? 1 : aName < bName ? -1 : 0
  })

export let validate = async function (input) {
  let valid = choices.find(
    choice =>
      input === choice.value ||
      input === choice.value + ".js" ||
      input === choice.name
  )

  if (valid) return true

  return chalk`Script {green.bold ${input}} not found. Please select a different script:`
}

export let exists = async input => {
  let result = exec(`command -v ${input}`, {
    silent: true,
  })

  let checkBin = await readdir(simplePath("bin"))

  if (result.stdout || checkBin.includes(input)) {
    return chalk`{red.bold ${input}} already exists. Please choose another name.`
  }

  let validName = input.match(/^([a-z]|\-)+$/g)

  if (!validName) {
    return chalk`{red.bold "${input}}" can only include lowercase and -`
  }

  return true
}
