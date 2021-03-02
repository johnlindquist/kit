//https://www.npmjs.com/package/shelljs#testexpression

let scriptName = "testing-new-and-rm"

let scriptExists = test(
  "-f",
  projectPath("scripts", scriptName + ".js")
)
let binExists = test("-f", projectPath("bin", scriptName))

if (scriptExists || binExists) {
  console.log({ scriptExists, binExists })
  console.log(chalk`{red Clearing out ${scriptName}}`)
  await cli("remove", scriptName, "--force")
}

console.log(chalk`--- {yellow NEW} ---`)
await cli("new", scriptName, "--no-edit")

test("-f", projectPath("scripts", scriptName + ".js"))
test("-f", projectPath("bin", scriptName))

scriptExists = test(
  "-f",
  projectPath("scripts", scriptName + ".js")
)
binExists = test("-f", projectPath("bin", scriptName))

if (!scriptExists || !binExists) {
  console.log({ scriptExists, binExists })
  console.log(chalk`{red Failed to create scripts}`)
  exit(1)
}

console.log(chalk`--- {yellow RM} ---`)
await cli("remove", scriptName, "--force")

test("-f", projectPath("scripts", scriptName + ".js"))
test("-f", projectPath("bin", scriptName))

scriptExists = test(
  "-f",
  projectPath("scripts", scriptName + ".js")
)
binExists = test("-f", projectPath("bin", scriptName))

if (scriptExists || binExists) {
  console.log({ scriptExists, binExists })
  console.log(chalk`{red Failed to remove scripts}`)
  exit(1)
}
