let [scripts] = await run("cli/scripts-info")

export const choices = scripts
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
      info: description && `<div>${description}</div>`,
    }
  })
  .sort((a, b) => {
    let aName = a.name.toLowerCase()
    let bName = b.name.toLowerCase()

    return aName > bName ? 1 : aName < bName ? -1 : 0
  })

export const validate = async function (input) {
  let valid = choices.find(
    choice =>
      input === choice.value ||
      input === choice.value + ".js" ||
      input === choice.name
  )

  if (valid) return true

  return chalk`Script {green.bold ${input}} not found. Please select a different script:`
}

export const exists = async input => {
  let result = exec(`command -v ${input}`, {
    silent: true,
  })

  if (result.stdout) {
    return chalk`{red.bold ${input}} already exists. Please choose another name.`
  }

  return true
}
