let { choices, validate, exists } = await import(
  "./scripts.js"
)

let script = await arg(
  `Which script do you want to rename?`,
  {
    choices,
    validate,
  }
)

let newScript = await arg(`Enter the new script name:`, {
  validate: exists,
})

let oldFilePath = path.join(
  env.SIMPLE_SCRIPTS_PATH,
  script + ".js"
)
let newFilePath = path.join(
  env.SIMPLE_SCRIPTS_PATH,
  newScript + ".js"
)
mv(oldFilePath, newFilePath)
await run("cli/create-bin", ["scripts/" + newScript])
trash(path.join(env.SIMPLE_BIN_PATH, script))
