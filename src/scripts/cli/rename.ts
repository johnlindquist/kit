let { exists, findScript, scripts } = await cli("fns")

let script = await arg(
  {
    placeholder: `Which script do you want to rename?`,
    validate: findScript,
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

console.log({ oldFilePath, newFilePath })

mv(oldFilePath, newFilePath)

let oldBin = kenvPath("bin", script.replace(".js", ""))
await trash(oldBin)
await cli("create-bin", "scripts", newScript)
edit(newFilePath, kenvPath())

export {}
