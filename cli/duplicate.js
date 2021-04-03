let { exists, scripts, validate } = await cli("fns")

let script = await arg(
  {
    placeholder: `Which script do you want to duplicate?`,
    validate,
  },
  scripts
)

let newScript = await arg({
  placeholder: `Enter the new script name:`,
  validate: exists,
})

let oldFilePath = path.join(kenvPath("scripts"), script)

if (!(await isFile(oldFilePath))) {
  console.warn(`${oldFilePath} doesn't exist...`)
  exit()
}

let newFilePath = path.join(
  kenvPath("scripts"),
  newScript + ".js"
)
cp(oldFilePath, newFilePath)
await cli("create-bin", "scripts", newScript)

edit(newFilePath, kenvPath())
