let { filePath, command } = await selectScript(
  `Open log for which script?`
)

edit(kenvPath("logs", `${command}.log`))

export {}
