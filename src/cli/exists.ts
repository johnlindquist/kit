let input = await arg("Script name")

export let exists = (await isBin(kenvPath("bin", input)))
  ? chalk`{red.bold "${input}}" already exists. Try again:`
  : (await isDir(kenvPath("bin", input)))
  ? chalk`{red.bold "${input}}" exists as group. Enter different name:`
  : exec(`command -v ${input}`, {
      silent: true,
    }).stdout
  ? chalk`{red.bold "${input}}" is a system command. Enter different name:`
  : !input.match(/^([a-z]|[0-9]|\-|\/)+$/g)
  ? chalk`{red.bold "${input}}" can only include lowercase, numbers, and -. Enter different name:`
  : true
