let { scripts } = await cli("fns")

let input = await arg("Enter Script name:")

let valid = (await scripts()).find(
  script => input === script + ".js" || input === script
)

export let found = valid
  ? true
  : chalk`Script {green.bold ${input}} not found. Please select a different script:`
