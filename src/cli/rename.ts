let { exists, scriptValue, scriptPathFromCommand } =
  await cli("fns")

let command = await arg(
  `Which script do you want to rename?`,
  scriptValue("command")
)

let newCommand = await arg({
  placeholder: `Enter the new script name:`,
  validate: exists,
})

let oldFilePath = scriptPathFromCommand(command)

if (!(await isFile(oldFilePath))) {
  console.warn(`${oldFilePath} doesn't exist...`)
  exit()
}

let newFilePath = scriptPathFromCommand(newCommand)

console.log({ oldFilePath, newFilePath })

mv(oldFilePath, newFilePath)

let oldBin = kenvPath("bin", command.replace(".js", ""))
await trash(oldBin)
await cli("create-bin", "scripts", newCommand)
edit(newFilePath, kenvPath())

export {}
