let { choices, validate, exists } = await import(
  "./scripts.js"
)

let script = await arg(
  {
    message: `Which script do you want to rename?`,
    validate,
  },
  choices
)

let newScript = await arg({
  message: `Enter the new script name:`,
  validate: exists,
})

let oldFilePath = path.join(
  projectPath("scripts"),
  script + ".js"
)
let newFilePath = path.join(
  projectPath("scripts"),
  newScript + ".js"
)
mv(oldFilePath, newFilePath)
await cli("create-bin", "scripts", newScript)
trash(projectPath("bin", script))
