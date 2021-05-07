let { scriptValue, scriptPathFromCommand } = (await cli(
  "fns"
)) as typeof import("./fns")

let command = await arg(
  `Which script do you want to duplicate?`,
  scriptValue("command")
)

let newCommand = await arg({
  placeholder: `Enter the new script name:`,
})

let oldFilePath = scriptPathFromCommand(command)

if (!(await isFile(oldFilePath))) {
  console.warn(`${oldFilePath} doesn't exist...`)
  exit()
}

let newFilePath = scriptPathFromCommand(newCommand)

cp(oldFilePath, newFilePath)
await cli("create-bin", "scripts", newCommand)

edit(newFilePath, kenvPath())

export {}
