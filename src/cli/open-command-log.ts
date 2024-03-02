let { filePath, command } = await selectScript(
  `Open log for which script?`
)

await edit(kenvPath("logs", `${command}.log`))

export {}
