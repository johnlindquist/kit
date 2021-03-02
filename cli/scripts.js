let { scriptsInfo } = await cli("scripts-info")

export let scripts = scriptsInfo
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
  try {
    let checkBin = await readdir(projectPath("bin"), {
      withFileTypes: true,
    })
    let checkFile = checkBin
      .filter(f => f.isFile())
      .map(({ name }) => name)

    if (checkFile.includes(input)) {
      return chalk`{red.bold "${input}}" exists as bin file. Enter different name:`
    }

    let checkDir = checkBin
      .filter(f => f.isDirectory())
      .map(({ name }) => name)
    if (checkDir.includes(input)) {
      return chalk`{red.bold "${input}}" exists as bin directory. Enter different name:`
    }

    let result = exec(`command -v ${input}`, {
      silent: true,
    })

    if (result.stdout) {
      return chalk`{red.bold "${input}}" is a system command. Enter different name:`
    }

    let validName = input.match(/^([a-z]|\-|\/)+$/g)

    if (!validName) {
      return chalk`{red.bold "${input}}" can only include lowercase and -. Enter different name:`
    }

    return true
  } catch (error) {
    console.warn(`Error validating that ${input} exists`)
  }
}
