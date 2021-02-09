//https://www.npmjs.com/package/shelljs#testexpression

let scriptName = "testing-new-and-rm"

let scriptExists = test(
  "-f",
  simplePath("scripts", scriptName + ".js")
)
let binExists = test("-f", simplePath("bin", scriptName))

if (scriptExists || binExists) {
  console.log({ scriptExists, binExists })
  console.log(chalk`{red Clearing out ${scriptName}}`)
  await simple("cli/remove", scriptName, "--force")
}

console.log(chalk`--- {yellow NEW} ---`)
await simple("cli/new", scriptName, "--no-edit")

test("-f", simplePath("scripts", scriptName + ".js"))
test("-f", simplePath("bin", scriptName))

scriptExists = test(
  "-f",
  simplePath("scripts", scriptName + ".js")
)
binExists = test("-f", simplePath("bin", scriptName))

if (!scriptExists || !binExists) {
  console.log({ scriptExists, binExists })
  console.log(chalk`{red Failed to create scripts}`)
  exit(1)
}

console.log(chalk`--- {yellow RM} ---`)
await simple("cli/remove", scriptName, "--force")

test("-f", simplePath("scripts", scriptName + ".js"))
test("-f", simplePath("bin", scriptName))

scriptExists = test(
  "-f",
  simplePath("scripts", scriptName + ".js")
)
binExists = test("-f", simplePath("bin", scriptName))

if (scriptExists || binExists) {
  console.log({ scriptExists, binExists })
  console.log(chalk`{red Failed to remove scripts}`)
  exit(1)
}
