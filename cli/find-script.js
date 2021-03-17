let { scripts } = await cli("fns")

let input = await arg("Enter Script name:")

let valid = (await scripts()).find(
  choice =>
    input === choice.value ||
    input === choice.value + ".js" ||
    input === choice.name
)

export let found = valid
  ? valid
  : chalk`Script {green.bold ${input}} not found. Please select a different script:`
